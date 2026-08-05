// ==UserScript==
// @name         Login Helper (ZTE/Multilaser/Huawei)
// @namespace    login.ops
// @version      1.1
// @description  Detecta páginas de login ZTE/Multilaser/Huawei e oferece preenchimento manual de credenciais via menu lateral. Não realiza login automático nem tentativas em sequência.
// @author       Matheus C. - FML
// @match        http://*/*
// @match        https://*/*
// @run-at       document-idle
// @noframes
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Segurança extra: mesmo com @noframes, garantimos que só rodamos no
    // documento de topo. Isso evita que o painel apareça dentro de iframes
    // internos do roteador (ex.: topFrame/mainFrame de páginas já logadas).
    if (window.top !== window.self) {
        return;
    }

    // ---------------------------------------------------------------
    // Perfis de credenciais (apenas para PREENCHIMENTO MANUAL).
    // O script NUNCA envia o formulário automaticamente.
    // O operador escolhe o perfil e decide se confirma o login.
    // ---------------------------------------------------------------
    const PROFILES = [
        { label: 'Admin1 / Senha1', user: 'admin1', pass: 'Senha1' },
        { label: 'Admin2 / Senha2', user: 'admin2', pass: 'Senha2' },
        { label: 'Admin3 / Senha3', user: 'admin3', pass: 'Senha3' },
        { label: 'Admin4 - Senha4', user: 'admin4', pass: 'Senha4' },
    ];

    // ---------------------------------------------------------------
    // Guarda contra falso-positivo: páginas internas do roteador (já
    // autenticadas) costumam usar um frameset com topFrame/mainFrame
    // (ex.: F670L) mesmo reutilizando IDs parecidos com os da tela de
    // login em formulários internos (ex.: troca de senha). Se esses
    // marcadores de "shell autenticado" existirem, tratamos a página
    // como NÃO sendo a tela de login inicial.
    // ---------------------------------------------------------------
    function isLikelyAuthenticatedShell() {
        if (document.getElementById('mainFrame') || document.getElementById('topFrame')) {
            return true;
        }
        return false;
    }

    // Sinal adicional exigido para o fallback genérico: precisa existir
    // algo que realmente pareça um botão/afordância de login na página,
    // não apenas os IDs de campo isolados.
    function pageHasLoginAffordance() {
        return !!document.querySelector('[id*="login" i], [class*="login" i], input[type="submit"], button[type="submit"]');
    }

    // ---------------------------------------------------------------
    // Detecção de modelo de página pela presença dos campos conhecidos
    // ---------------------------------------------------------------
    function detectModel() {
        if (isLikelyAuthenticatedShell()) {
            return null;
        }

        // Multilaser: input dentro de <li class="login_li_2">
        const multilaserUser = document.querySelector('li.login_li_2 input#Frm_Username, input.username#Frm_Username');
        const multilaserPass = document.querySelector('li.login_li_2 input#Frm_Password, input.password#Frm_Password');
        if (multilaserUser && multilaserPass) {
            return { model: 'Multilaser', userField: multilaserUser, passField: multilaserPass };
        }

        // ZTE: input dentro de <div class="right">, classes w180 / passInvisible
        const zteUser = document.querySelector('div.right input#Frm_Username');
        const ztePass = document.querySelector('div.right input#Frm_Password, input#Frm_Password.passInvisible');
        if (zteUser && ztePass) {
            return { model: 'ZTE', userField: zteUser, passField: ztePass };
        }

        // Huawei (ex.: EG8145V5): campos txt_Username / txt_Password + botão loginbutton
        const huaweiUser = document.getElementById('txt_Username');
        const huaweiPass = document.getElementById('txt_Password');
        const huaweiLoginBtn = document.getElementById('loginbutton');
        if (huaweiUser && huaweiPass && huaweiLoginBtn) {
            return { model: 'Huawei (EG8145V5)', userField: huaweiUser, passField: huaweiPass };
        }

        // Fallback genérico: campos com os mesmos IDs em qualquer estrutura,
        // mas só aceitamos se a página também tiver alguma afordância de
        // login visível (evita bater em formulários internos que reusam
        // os mesmos IDs, como troca de senha pós-login).
        const genUser = document.getElementById('Frm_Username');
        const genPass = document.getElementById('Frm_Password');
        if (genUser && genPass && pageHasLoginAffordance()) {
            return { model: 'Desconhecido (IDs padrão)', userField: genUser, passField: genPass };
        }

        return null;
    }

    function fillFields(detected, profile, btn) {
        const { userField, passField } = detected;

        const setValue = (el, value) => {
            el.focus();
            el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        };

        setValue(userField, profile.user);
        setValue(passField, profile.pass);

        if (btn) {
            btn.classList.add('lh-tried');
        }

        logAttempt(`Preenchido: ${profile.label} (modelo ${detected.model})`);
    }

    // ---------------------------------------------------------------
    // Log simples de quais preenchimentos foram feitos (não de tentativas
    // de login - o script não envia formulário nem verifica resultado).
    // ---------------------------------------------------------------
    let logEntries = [];
    function logAttempt(text) {
        const time = new Date().toLocaleTimeString();
        logEntries.unshift(`[${time}] ${text}`);
        if (logEntries.length > 20) logEntries.pop();
        renderLog();
    }

    function renderLog() {
        const logBox = document.getElementById('lh-log');
        if (!logBox) return;
        logBox.innerHTML = logEntries.map(e => `<div class="lh-log-item">${e}</div>`).join('');
    }

    // ---------------------------------------------------------------
    // UI: painel lateral fixo
    // ---------------------------------------------------------------
    function buildPanel(detected) {
        const style = document.createElement('style');
        style.textContent = `
            #lh-panel {
                position: fixed;
                top: 80px;
                left: 0;
                width: 230px;
                background: #ffffff;
                border: 1px solid #cc0000;
                border-left: 4px solid #cc0000;
                border-radius: 0 6px 6px 0;
                box-shadow: 2px 2px 8px rgba(0,0,0,0.2);
                font-family: Arial, sans-serif;
                font-size: 12px;
                color: #313131;
                z-index: 999999;
            }
            #lh-panel .lh-header {
                background: #cc0000;
                color: #fff;
                padding: 8px 10px;
                font-weight: bold;
                font-size: 13px;
            }
            #lh-panel .lh-model {
                padding: 6px 10px;
                font-size: 11px;
                color: #555;
                border-bottom: 1px solid #eee;
            }
            #lh-panel .lh-body {
                padding: 8px 10px;
            }
            #lh-panel button.lh-profile-btn {
                display: block;
                width: 100%;
                margin-bottom: 6px;
                padding: 6px 8px;
                background: #ffd600;
                border: 1px solid #cc0000;
                border-radius: 4px;
                color: #313131;
                font-size: 12px;
                cursor: pointer;
                text-align: left;
            }
            #lh-panel button.lh-profile-btn:hover {
                background: #ffe14d;
            }
            #lh-panel button.lh-profile-btn.lh-tried {
                background: #d9d9d9;
                border-color: #9a9a9a;
                color: #777;
            }
            #lh-panel button.lh-profile-btn.lh-tried:hover {
                background: #cfcfcf;
            }
            #lh-panel .lh-profile-row {
                display: flex;
                align-items: center;
                gap: 4px;
                margin-bottom: 6px;
            }
            #lh-panel .lh-profile-row button.lh-profile-btn {
                margin-bottom: 0;
                flex: 1;
            }
            #lh-panel .lh-fail-btn {
                width: 22px;
                height: 28px;
                border: 1px solid #9a9a9a;
                background: #f2f2f2;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
                color: #6c0101;
                flex-shrink: 0;
            }
            #lh-panel .lh-fail-btn:hover {
                background: #ffe4e4;
            }
            #lh-panel .lh-reset-btn {
                margin-top: 4px;
                width: 100%;
                padding: 4px;
                font-size: 10px;
                background: #fff;
                border: 1px solid #ccc;
                border-radius: 4px;
                cursor: pointer;
                color: #777;
            }
            #lh-panel .lh-reset-btn:hover {
                background: #f5f5f5;
            }
            #lh-panel .lh-log-title {
                margin-top: 8px;
                font-weight: bold;
                font-size: 11px;
                border-top: 1px solid #eee;
                padding-top: 6px;
            }
            #lh-log {
                max-height: 150px;
                overflow-y: auto;
                margin-top: 4px;
            }
            #lh-log .lh-log-item {
                font-size: 10px;
                color: #555;
                padding: 2px 0;
                border-bottom: 1px dotted #eee;
            }
            #lh-panel .lh-toggle {
                position: absolute;
                top: 0;
                right: -22px;
                width: 22px;
                height: 28px;
                background: #cc0000;
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                border-radius: 0 4px 4px 0;
                font-size: 12px;
            }
        `;
        document.head.appendChild(style);

        const panel = document.createElement('div');
        panel.id = 'lh-panel';
        panel.innerHTML = `
            <div class="lh-header">· Login Helper</div>
            <div class="lh-model">Modelo detectado: <b>${detected.model}</b></div>
            <div class="lh-body">
                <div id="lh-profile-buttons"></div>
                <div class="lh-log-title">Histórico de preenchimentos</div>
                <div id="lh-log"></div>
            </div>
            <div class="lh-toggle" id="lh-toggle">&laquo;</div>
        `;
        document.body.appendChild(panel);

        const btnContainer = panel.querySelector('#lh-profile-buttons');
        PROFILES.forEach((profile) => {
            const row = document.createElement('div');
            row.className = 'lh-profile-row';

            const btn = document.createElement('button');
            btn.className = 'lh-profile-btn';
            btn.textContent = profile.label;
            btn.addEventListener('click', () => fillFields(detected, profile, btn));

            const failBtn = document.createElement('button');
            failBtn.className = 'lh-fail-btn';
            failBtn.textContent = '✕';
            failBtn.title = 'Marcar como falhou / clicar novamente reativa o perfil';
            failBtn.addEventListener('click', () => {
                if (btn.classList.contains('lh-tried')) {
                    // Já estava cinza (marcado) - reativa o perfil.
                    btn.classList.remove('lh-tried');
                    logAttempt(`Reativado: ${profile.label}`);
                } else {
                    btn.classList.add('lh-tried');
                    logAttempt(`Falhou: ${profile.label} - usuário ou senha incorretos`);
                }
            });

            row.appendChild(btn);
            row.appendChild(failBtn);
            btnContainer.appendChild(row);
        });

        const resetBtn = document.createElement('button');
        resetBtn.className = 'lh-reset-btn';
        resetBtn.textContent = 'Limpar marcações';
        resetBtn.addEventListener('click', () => {
            // Remove marcação visual de "testado/falhou" de todos os perfis.
            btnContainer.querySelectorAll('.lh-profile-btn').forEach(b => b.classList.remove('lh-tried'));

            // Limpa o histórico de log exibido no painel.
            logEntries = [];
            renderLog();

            // Limpa os campos de usuário/senha realmente preenchidos na página.
            const setValue = (el, value) => {
                if (!el) return;
                el.focus();
                el.value = value;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            };
            setValue(detected.userField, '');
            setValue(detected.passField, '');

            logAttempt('Marcações, histórico e campos limpos pelo operador.');
        });
        panel.querySelector('.lh-body').appendChild(resetBtn);

        // Toggle de colapsar/expandir o painel
        const toggle = panel.querySelector('#lh-toggle');
        let collapsed = false;
        toggle.addEventListener('click', () => {
            collapsed = !collapsed;
            panel.style.transform = collapsed ? 'translateX(-100%)' : 'translateX(0)';
            toggle.textContent = collapsed ? '\u00bb' : '\u00ab';
        });
        panel.style.transition = 'transform 0.2s ease';

        logAttempt('Painel carregado. Nenhuma ação realizada ainda.');
    }

    // ---------------------------------------------------------------
    // Execução
    // ---------------------------------------------------------------
    const detected = detectModel();
    if (detected) {
        buildPanel(detected);
    }
    // Se não detectar nenhum modelo conhecido, o script não faz nada.
})();