// ==UserScript==
// @name         Botões de Respostas Rápidas Matrix Go
// @namespace    http://tampermonkey.net/
// @version      4.3
// @description  Menu lateral premium com abertura direta no hover, sem scroll e com correção de clipping na tela.
// @author       Matheus C. - FML
// @match        *://*.matrixdobrasil.ai/*
// @match        file:///*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Lista de frases padrão alinhada com os ícones e cores premium
    const defaultCategorias = [
        {
            nome: "👋 Saudação",
            cor: "#0074e4",
            botoes: [
                { label: "Bom Dia", texto: "Olá, Bom dia! Me chamo {nome}, do Suporte Técnico. Estou aqui para te ajudar e dar continuidade ao seu atendimento. Como posso te auxiliar?" },
                { label: "Boa Tarde", texto: "Olá, Boa tarde! Me chamo {nome}, do Suporte Técnico. Estou aqui para te ajudar e dar continuidade ao seu atendimento. Como posso te auxiliar?" },
                { label: "Boa Noite", texto: "Olá, Boa noite! Me chamo {nome}, do Suporte Técnico. Estou aqui para te ajudar e dar continuidade ao seu atendimento. Como posso te auxiliar?" }
            ]
        },
        {
            nome: "🔧 Técnico",
            cor: "#f59e0b",
            botoes: [
                { label: "Suporte Padrão", texto: "Prezado cliente, daremos início aos testes na sua conexão..." }
            ]
        },
        {
            nome: "📺 Massiva",
            cor: "#ef4444",
            botoes: [
                { label: "Alerta de Massiva", texto: "Identificamos uma oscilação geral em sua região..." }
            ]
        },
        {
            nome: "📺 IPTV",
            cor: "#a855f7",
            botoes: [
                { label: "Atualizar IPTV", texto: "Por gentileza, reinicie o seu aplicativo de IPTV..." }
            ]
        },
        {
            nome: "✅ Finalização",
            cor: "#10b981",
            botoes: [
                { label: "Encerrar", texto: "Ficamos felizes em ajudar! Agradecemos seu contato." }
            ]
        },
        {
            nome: "❤️ Teste",
            cor: "#ec4899",
            botoes: [
                { label: "Ping Teste", texto: "Poderia realizar um teste de velocidade para nós?" }
            ]
        }
    ];

    function obterCategorias() {
        let cat = localStorage.getItem('ms_categorias_v2');
        if (!cat) {
            localStorage.setItem('ms_categorias_v2', JSON.stringify(defaultCategorias));
            return defaultCategorias;
        }
        return JSON.parse(cat);
    }

    function salvarCategorias(data) {
        localStorage.setItem('ms_categorias_v2', JSON.stringify(data));
        renderizarMenu();
        renderizarCRUDList();
    }

    function fecharMenuPrincipal() {
        const menuPanel = document.querySelector('.ms-menu-panel');
        if (menuPanel && !menuPanel.classList.contains('hidden')) {
            menuPanel.classList.add('hidden');
        }
    }

    function inserirTexto(mensagem) {
        const nomeAtendente = localStorage.getItem('ms_operator_name') || 'Atendente';
        const textoFinal = messageReplace(mensagem, "{nome}", nomeAtendente);

        const campo = document.querySelectorAll('.faketextbox.pastable, [contenteditable="true"]');
        const ativo = Array.from(campo).find(el => el.offsetParent !== null);
        if (ativo) {
            ativo.focus();
            ativo.innerHTML = '';
            document.execCommand('insertText', false, textoFinal);
            ['input', 'change'].forEach(t => ativo.dispatchEvent(new Event(t, { bubbles: true })));
        }
        fecharMenuPrincipal();
    }

    function messageReplace(str, find, replace) {
        return str.split(find).join(replace);
    }

    // CSS Totalmente Remodelado (Garante exibição sem scroll e sem cortes de tela)
    const style = document.createElement('style');
    style.innerHTML = `
        .ms-wrapper {
            position: fixed;
            left: 0px;
            top: 12%;
            z-index: 999999;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
        }

        .ms-main-toggle {
            background: #262626;
            color: white;
            border: none;
            padding: 10px;
            cursor: pointer;
            border-radius: 12px;
            font-size: 18px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s, transform 0.1s;
            margin-left: 8px;
            margin-bottom: 4px;
        }
        .ms-main-toggle:hover { background: #3f3f46; transform: scale(1.05); }

        /* Painel Ajustado: Sem overflow oculto para permitir que o submenu flutue livremente */
        .ms-menu-panel {
            display: flex;
            flex-direction: column;
            gap: 6px;
            width: auto;
            box-sizing: border-box;
            transition: all 0.2s ease;
            padding-left: 8px; /* Corrige o corte das letras iniciais na esquerda */
            padding-right: 12px;
        }

        .ms-menu-panel.hidden { display: none; }

        .ms-btn-manage {
            background: #262626;
            color: #e4e4e7;
            border: none;
            padding: 9px 14px;
            border-radius: 0 20px 20px 0;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.2s;
            text-align: left;
            width: max-content;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
            margin-top: 4px;
        }
        .ms-btn-manage:hover { background: #3f3f46; color: white; }

        .ms-cat-item { position: relative; display: flex; align-items: center; }

        /* Pílulas de Categorias Laterais */
        .ms-cat-label {
            padding: 8px 16px 8px 14px;
            border-radius: 0 30px 30px 0;
            cursor: pointer;
            font-size: 13.5px;
            font-weight: 600;
            color: #ffffff;
            background-color: #3f3f46 !important;
            display: flex;
            align-items: center;
            transition: transform 0.2s, filter 0.2s;
            width: max-content;
            min-width: 125px;
            box-sizing: border-box;
            white-space: nowrap;
            gap: 6px;
            box-shadow: 0 5px 12px rgba(0,0,0,0.2);
            border: none;
        }
        .ms-cat-label:hover {
            filter: brightness(1.15);
            transform: translateX(4px);
        }

        /* Submenu Suspenso Completo Direto na Tela (Sem restrição de Scroll) */
        .ms-submenu {
            display: none;
            position: absolute;
            top: 0;
            left: 100%;
            margin-left: 10px;
            flex-direction: column;
            gap: 5px;
            padding: 8px;
            background: #262626;
            border: 1px solid #4a4a4a;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.35);
            min-width: 240px;
            max-width: 420px;
            z-index: 1000000;
            width: max-content;
            /* Scroll removido para exibir os botões por completo direto na tela */
            max-height: none !important;
            overflow-y: visible !important;
        }
        .ms-submenu.active { display: flex; }

        .ms-btn-msg-item {
            width: 100%;
            text-align: left;
            padding: 8px 12px;
            font-size: 12px;
            border: none;
            border-radius: 6px;
            background-color: #3f3f46;
            cursor: pointer;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            transition: background 0.15s, color 0.15s;
            color: #e4e4e7;
            font-weight: 500;
            box-sizing: border-box;
        }
        .ms-btn-msg-item:hover { background-color: #52525b !important; color: #ffffff !important; }

        .ms-action-btn { border: none; background: transparent; color: white; cursor: pointer; font-size: 11px; padding: 0 2px; }
        .ms-action-btn:hover { filter: brightness(0.8); }
    `;
    document.head.appendChild(style);

    function inicializar() {
        const wrapper = document.createElement('div');
        wrapper.className = 'ms-wrapper';

        const mainToggle = document.createElement('button');
        mainToggle.className = 'ms-main-toggle';
        mainToggle.innerText = '⚙️';
        mainToggle.title = "Mostrar/Ocultar Painel";

        const menuPanel = document.createElement('div');
        menuPanel.className = 'ms-menu-panel hidden';

        const categoriesBox = document.createElement('div');
        categoriesBox.id = 'ms-menu-categories-box';
        categoriesBox.style.display = 'flex';
        categoriesBox.style.flexDirection = 'column';
        categoriesBox.style.gap = '6px';
        menuPanel.appendChild(categoriesBox);

        const manageBtn = document.createElement('button');
        manageBtn.className = 'ms-btn-manage';
        manageBtn.innerText = '🛠️ Configurar Frases';
        manageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('ms-crud-modal').style.display = 'flex';
            renderizarCRUDList();
            atualizarDropdownCategorias();

            const opInput = document.getElementById('ms-form-operator-name');
            if (opInput) opInput.value = localStorage.getItem('ms_operator_name') || '';
        });
        menuPanel.appendChild(manageBtn);

        mainToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            menuPanel.classList.toggle('hidden');
        });

        document.addEventListener('click', (event) => {
            if (!wrapper.contains(event.target)) {
                fecharMenuPrincipal();
            }
        });

        wrapper.appendChild(mainToggle);
        wrapper.appendChild(menuPanel);
        document.body.appendChild(wrapper);

        criarModalCRUD();
        renderizarMenu();
    }

    let globalFecharTimer;
    function renderizarMenu() {
        const menuContainer = document.getElementById('ms-menu-categories-box');
        if (!menuContainer) return;
        menuContainer.innerHTML = '';

        const categorias = obterCategorias();
        categorias.forEach((cat, catIdx) => {
            if (cat.botoes.length === 0) return;

            const catItem = document.createElement('div');
            catItem.className = 'ms-cat-item';

            const label = document.createElement('div');
            label.className = 'ms-cat-label';
            label.style.borderLeft = `5px solid ${cat.cor}`;
            label.innerHTML = `<span>${cat.nome}</span>`;

            const submenu = document.createElement('div');
            submenu.className = 'ms-submenu';

            cat.botoes.forEach(b => {
                const btn = document.createElement('button');
                btn.className = 'ms-btn-msg-item';
                btn.innerText = b.label;
                btn.title = b.texto;
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    inserirTexto(b.texto);
                });
                submenu.appendChild(btn);
            });

            catItem.appendChild(label);
            catItem.appendChild(submenu);
            menuContainer.appendChild(catItem);

            const ativarSubmenu = () => {
                clearTimeout(globalFecharTimer);
                document.querySelectorAll('.ms-submenu.active').forEach(openMenu => {
                    if (openMenu !== submenu) {
                        openMenu.classList.remove('active');
                    }
                });

                // Reseta propriedades estruturais antes do cálculo de tela
                submenu.style.top = '0px';
                submenu.style.bottom = 'auto';
                submenu.classList.add('active');

                // Lógica Inteligente Anti-Clipping (Joga o menu para cima se for estourar o rodapé)
                const rect = submenu.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                if (rect.bottom > windowHeight) {
                    submenu.style.top = 'auto';
                    submenu.style.bottom = '0px';
                }
            };

            const desativarSubmenu = () => {
                globalFecharTimer = setTimeout(() => {
                    submenu.classList.remove('active');
                }, 300);
            };

            catItem.addEventListener('mouseenter', ativarSubmenu);
            catItem.addEventListener('mouseleave', desativarSubmenu);
        });
    }

    function criarModalCRUD() {
        const modal = document.createElement('div');
        modal.id = 'ms-crud-modal';
        modal.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.6); z-index:10000000; align-items:center; justify-content:center; backdrop-filter: blur(2px);";
        modal.innerHTML = `
            <div style="background:#fff; width:94%; max-width:1020px; height:85vh; border-radius:12px; padding:24px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); display:flex; flex-direction:column; font-family:system-ui,-apple-system,sans-serif;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px;">
                    <h2 style="margin:0; font-size:18px; color:#1e293b; font-weight:bold;">🛠️ Painel Avançado de Controle - Frases do Suporte</h2>
                    <button id="ms-close-modal" style="background:none; border:none; font-size:24px; cursor:pointer; color:#64748b;">&times;</button>
                </div>
                <div style="display:flex; gap:20px; flex:1; min-height:0;">
                    <div style="flex:1; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; display:flex; flex-direction:column; gap:12px; overflow-y:auto; box-sizing:border-box; padding:16px;">

                        <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; border: 1px dashed #cbd5e1; margin-bottom: 4px;">
                            <label style="display:block; font-size:13px; font-weight:700; color:#1e293b; margin-bottom:6px;">👤 Operador Responsável</label>
                            <input type="text" id="ms-form-operator-name" placeholder="Nome do Atendente para as saudações" style="width:100%; padding:8px; font-size:13px; border:1px solid #cbd5e1; border-radius:4px; box-sizing:border-box; background:#ffffff; color:#1e293b; font-weight:500;">
                        </div>

                        <h3 id="ms-crud-title" style="margin:0; font-size:15px; color:#1e293b; font-weight:bold;">Adicionar / Editar Elemento</h3>
                        <div>
                            <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:4px;">Tipo de Operação</label>
                            <select id="ms-form-type" style="width:100%; padding:8px; font-size:13px; border:1px solid #cbd5e1; border-radius:4px; background:#fff;">
                                <option value="btn">Nova Frase (Dentro de uma Categoria)</option>
                                <option value="cat">Nova Categoria Principal</option>
                            </select>
                        </div>
                        <div id="ms-box-select-cat">
                            <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:4px;">Selecionar Categoria Destino</label>
                            <select id="ms-form-cat" style="width:100%; padding:8px; font-size:13px; border:1px solid #cbd5e1; border-radius:4px; background:#fff;"></select>
                        </div>
                        <div>
                            <label id="ms-label-name" style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:4px;">Nome da Frase / Título da Categoria</label>
                            <input type="text" id="ms-form-name" placeholder="Ex: Bom dia / Suporte Avançado" style="width:100%; padding:8px; font-size:13px; border:1px solid #cbd5e1; border-radius:4px; box-sizing:border-box;">
                        </div>
                        <div id="ms-box-color" style="display:none;">
                            <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:4px;">Cor da Categoria (Hexadecimal)</label>
                            <input type="color" id="ms-form-color" value="#3b82f6" style="width:100%; height:38px; padding:2px; border:1px solid #cbd5e1; border-radius:4px; box-sizing:border-box; cursor:pointer;">
                        </div>
                        <div id="ms-box-text">
                            <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:4px;">Conteúdo Completo da Frase</label>
                            <textarea id="ms-form-text" placeholder="Insira o texto completo. Use {nome} para inserir o nome do atendente dinamicamente." style="width:100%; height:130px; padding:8px; font-size:13px; border:1px solid #cbd5e1; border-radius:4px; box-sizing:border-box; resize:none;"></textarea>
                        </div>
                        <button id="ms-btn-save-crud" style="background:#2563eb; color:white; border:none; padding:10px; border-radius:4px; cursor:pointer; font-size:13px; font-weight:bold; transition: background .15s;">💾 Salvar Configurações</button>
                        <button id="ms-btn-cancel-edit" style="display:none; background:#64748b; color:white; border:none; padding:10px; border-radius:4px; cursor:pointer; font-size:13px; font-weight:bold;">Cancelar Edição</button>
                    </div>

                    <div style="flex:1.4; display:flex; flex-direction:column; gap:12px; box-sizing:border-box; min-height:0;">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                            <h3 style="margin:0; font-size:14px; color:#334155; font-weight:bold;">Menus e Frases Cadastradas</h3>
                            <div style="display:flex; gap:4px;">
                                <button id="ms-btn-export" style="background:#06b6d4; color:white; border:none; padding:6px 10px; border-radius:4px; font-size:12px; font-weight:bold; cursor:pointer;">📥 Exportar</button>
                                <button id="ms-btn-import" style="background:#f59e0b; color:white; border:none; padding:6px 10px; border-radius:4px; font-size:12px; font-weight:bold; cursor:pointer;">📤 Importar</button>
                                <button id="ms-btn-reset" style="background:#ef4444; color:white; border:none; padding:6px 10px; border-radius:4px; font-size:12px; font-weight:bold; cursor:pointer;">🔄 Resetar</button>
                            </div>
                        </div>
                        <div id="ms-crud-list-container" style="flex:1; border:1px solid #e2e8f0; border-radius:8px; padding:12px; overflow-y:auto; background:#ffffff; box-sizing:border-box;"></div>
                    </div>
                </div>
            </div>
            <input type="file" id="ms-file-import" accept=".json" style="display:none;">
        `;
        document.body.appendChild(modal);

        document.getElementById('ms-close-modal').addEventListener('click', () => {
            modal.style.display = 'none';
            limparFormulario();
        });

        const operatorInput = document.getElementById('ms-form-operator-name');
        if (operatorInput) {
            operatorInput.value = localStorage.getItem('ms_operator_name') || '';
            operatorInput.addEventListener('input', (e) => {
                localStorage.setItem('ms_operator_name', e.target.value);
            });
        }

        document.getElementById('ms-form-type').addEventListener('change', (e) => {
            const isCat = e.target.value === 'cat';
            document.getElementById('ms-box-select-cat').style.display = isCat ? 'none' : 'block';
            document.getElementById('ms-box-color').style.display = isCat ? 'block' : 'none';
            document.getElementById('ms-box-text').style.display = isCat ? 'none' : 'block';
            document.getElementById('ms-label-name').innerText = isCat ? 'Título da Nova Categoria' : 'Nome da Frase / Atalho';
        });

        document.getElementById('ms-btn-save-crud').addEventListener('click', executarSalvarCRUD);
        document.getElementById('ms-btn-cancel-edit').addEventListener('click', limparFormulario);
        document.getElementById('ms-btn-export').addEventListener('click', exportarConfigJSON);
        document.getElementById('ms-btn-import').addEventListener('click', () => document.getElementById('ms-file-import').click());
        document.getElementById('ms-file-import').addEventListener('change', importarConfigJSON);
        document.getElementById('ms-btn-reset').addEventListener('click', () => {
            if (confirm('Tem certeza de que deseja apagar todas as customizações e voltar ao layout de fábrica?')) {
                localStorage.removeItem('ms_categorias_v2');
                alert('Layout restaurado com sucesso!');
                location.reload();
            }
        });
    }

    let editTarget = null;
    window.moverCategoria = function(idx, direcao) {
        let currentCats = obterCategorias();
        if (direcao === 'subir' && idx > 0) {
            [currentCats[idx], currentCats[idx - 1]] = [currentCats[idx - 1], currentCats[idx]];
        } else if (direcao === 'descer' && idx < currentCats.length - 1) {
            [currentCats[idx], currentCats[idx + 1]] = [currentCats[idx + 1], currentCats[idx]];
        }
        salvarCategorias(currentCats);
        atualizarDropdownCategorias();
    };

    window.moverFrase = function(catIdx, btnIdx, direcao) {
        let currentCats = obterCategorias();
        let botoes = currentCats[catIdx].botoes;
        if (direcao === 'subir' && btnIdx > 0) {
            [botoes[btnIdx], botoes[btnIdx - 1]] = [botoes[btnIdx - 1], botoes[btnIdx]];
        } else if (direcao === 'descer' && btnIdx < botoes.length - 1) {
            [botoes[btnIdx], botoes[btnIdx + 1]] = [botoes[btnIdx + 1], botoes[btnIdx]];
        }
        salvarCategorias(currentCats);
    };

    function renderizarCRUDList() {
        const container = document.getElementById('ms-crud-list-container');
        if (!container) return;
        container.innerHTML = '';

        const categorias = obterCategorias();
        categorias.forEach((cat, catIdx) => {
            const catDiv = document.createElement('div');
            catDiv.style.cssText = 'margin-bottom:14px; border:1px solid #cbd5e1; border-radius:6px; overflow:hidden; font-size:13px;';

            const header = document.createElement('div');
            header.style.cssText = `background:${cat.cor}; color:#fff; padding:8px 12px; font-weight:bold; display:flex; justify-content:space-between; align-items:center;`;
            header.innerHTML = `<span>${cat.nome}</span>`;

            const catActions = document.createElement('div');
            catActions.style.display = 'flex';
            catActions.style.gap = '6px';
            catActions.innerHTML += `
                <button class="ms-action-btn" title="Mover Categoria para Cima" onclick="moverCategoria(${catIdx}, 'subir')">🔼</button>
                <button class="ms-action-btn" title="Mover Categoria para Baixo" onclick="moverCategoria(${catIdx}, 'descer')">🔽</button>
            `;

            const editCatBtn = document.createElement('button');
            editCatBtn.innerText = '✏️';
            editCatBtn.className = 'ms-action-btn';
            editCatBtn.addEventListener('click', () => preencherFormularioEdicao(catIdx, null));

            const deleteCatBtn = document.createElement('button');
            deleteCatBtn.innerText = '🗑️';
            deleteCatBtn.className = 'ms-action-btn';
            deleteCatBtn.addEventListener('click', () => {
                if (confirm(`Aviso crucial: Deletar a categoria "${cat.nome}" apagará TODOS os botões associados a ela! Confirmar?`)) {
                    let currentCats = obterCategorias();
                    currentCats.splice(catIdx, 1);
                    salvarCategorias(currentCats);
                    atualizarDropdownCategorias();
                }
            });

            catActions.appendChild(editCatBtn);
            catActions.appendChild(deleteCatBtn);
            header.appendChild(catActions);
            catDiv.appendChild(header);

            if (cat.botoes.length === 0) {
                const empty = document.createElement('div');
                empty.style.cssText = 'padding:8px 12px; color:#94a3b8; font-style:italic; background:#f8fafc; font-size:12px;';
                empty.innerText = 'Nenhuma resposta salva nesta aba.';
                catDiv.appendChild(empty);
            } else {
                cat.botoes.forEach((btn, btnIdx) => {
                    const row = document.createElement('div');
                    row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border-bottom:1px solid #f1f5f9; background:#fff;';
                    if (btnIdx === cat.botoes.length - 1) row.style.borderBottom = 'none';

                    const textSpan = document.createElement('span');
                    textSpan.style.cssText = 'font-weight:600; color:#334155; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:65%; font-size:12px;';
                    textSpan.innerText = btn.label;
                    textSpan.title = btn.texto;

                    const actions = document.createElement('div');
                    actions.style.display = 'flex';
                    actions.style.gap = '6px';
                    actions.innerHTML += `
                        <button class="ms-action-btn" style="color:#475569" title="Subir Posição da Frase" onclick="moverFrase(${catIdx}, ${btnIdx}, 'subir')">🔼</button>
                        <button class="ms-action-btn" style="color:#475569" title="Descer Posição da Frase" onclick="moverFrase(${catIdx}, ${btnIdx}, 'descer')">🔽</button>
                    `;

                    const editBtn = document.createElement('button');
                    editBtn.innerText = '✏️';
                    editBtn.style.cssText = 'border:none; background:transparent; cursor:pointer; font-size:12px;';
                    editBtn.addEventListener('click', () => preencherFormularioEdicao(catIdx, btnIdx));

                    const deleteBtn = document.createElement('button');
                    deleteBtn.innerText = '🗑️';
                    deleteBtn.style.cssText = 'border:none; background:transparent; cursor:pointer; font-size:12px;';
                    deleteBtn.addEventListener('click', () => {
                        if (confirm(`Deseja remover a frase "${btn.label}" permanentemente?`)) {
                            let currentCats = obterCategorias();
                            currentCats[catIdx].botoes.splice(btnIdx, 1);
                            salvarCategorias(currentCats);
                            atualizarDropdownCategorias();
                        }
                    });

                    actions.appendChild(editBtn);
                    actions.appendChild(deleteBtn);
                    row.appendChild(textSpan);
                    row.appendChild(actions);
                    catDiv.appendChild(row);
                });
            }
            container.appendChild(catDiv);
        });
    }

    function atualizarDropdownCategorias() {
        const select = document.getElementById('ms-form-cat');
        if (!select) return;
        select.innerHTML = '';
        const categorias = obterCategorias();
        categorias.forEach((cat, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.innerText = cat.nome;
            select.appendChild(opt);
        });
    }

    function preencherFormularioEdicao(catIdx, btnIdx) {
        const categorias = obterCategorias();
        const typeSelect = document.getElementById('ms-form-type');
        const nameInput = document.getElementById('ms-form-name');
        const textInput = document.getElementById('ms-form-text');
        const colorInput = document.getElementById('ms-form-color');
        const catSelect = document.getElementById('ms-form-cat');

        document.getElementById('ms-btn-cancel-edit').style.display = 'inline-block';
        document.getElementById('ms-crud-title').innerText = '✏️ Modo de Edição Ativo';
        document.getElementById('ms-crud-title').style.color = '#2563eb';

        if (btnIdx === null) {
            editTarget = { catIdx, type: 'cat' };
            typeSelect.value = 'cat';
            typeSelect.disabled = true;
            nameInput.value = categorias[catIdx].nome;
            colorInput.value = categorias[catIdx].cor || '#3b82f6';

            document.getElementById('ms-box-select-cat').style.display = 'none';
            document.getElementById('ms-box-color').style.display = 'block';
            document.getElementById('ms-box-text').style.display = 'none';
            document.getElementById('ms-label-name').innerText = 'Título da Categoria';
        } else {
            editTarget = { catIdx, btnIdx, type: 'btn' };
            typeSelect.value = 'btn';
            typeSelect.disabled = true;
            catSelect.value = catIdx;
            nameInput.value = categorias[catIdx].botoes[btnIdx].label;
            textInput.value = categorias[catIdx].botoes[btnIdx].texto;

            document.getElementById('ms-box-select-cat').style.display = 'block';
            document.getElementById('ms-box-color').style.display = 'none';
            document.getElementById('ms-box-text').style.display = 'block';
            document.getElementById('ms-label-name').innerText = 'Nome da Frase / Atalho';
        }
    }

    function executarSalvarCRUD() {
        const type = document.getElementById('ms-form-type').value;
        const name = document.getElementById('ms-form-name').value.trim();
        const text = document.getElementById('ms-form-text').value.trim();
        const color = document.getElementById('ms-form-color').value;
        const catIdx = parseInt(document.getElementById('ms-form-cat').value, 10);

        if (!name) {
            alert('Por favor, preencha o campo de nome/título.');
            return;
        }

        let currentCats = obterCategorias();
        if (editTarget) {
            if (editTarget.type === 'cat') {
                currentCats[editTarget.catIdx].nome = name;
                currentCats[editTarget.catIdx].cor = color;
            } else if (editTarget.type === 'btn') {
                if (editTarget.catIdx !== catIdx) {
                    currentCats[editTarget.catIdx].botoes.splice(editTarget.btnIdx, 1);
                    currentCats[catIdx].botoes.push({ label: name, texto: text });
                } else {
                    currentCats[editTarget.catIdx].botoes[editTarget.btnIdx] = { label: name, texto: text };
                }
            }
        } else {
            if (type === 'cat') {
                currentCats.push({ nome: name, color: color, botoes: [] });
            } else {
                if (isNaN(catIdx) || catIdx < 0) {
                    alert('Crie uma categoria antes de adicionar frases.');
                    return;
                }
                currentCats[catIdx].botoes.push({ label: name, texto: text });
            }
        }

        salvarCategorias(currentCats);
        atualizarDropdownCategorias();
        limparFormulario();
        alert('Dados salvos e atualizados com sucesso!');
    }

    function limparFormulario() {
        editTarget = null;
        const typeSelect = document.getElementById('ms-form-type');
        typeSelect.disabled = false;
        typeSelect.value = 'btn';

        document.getElementById('ms-form-name').value = '';
        document.getElementById('ms-form-text').value = '';
        document.getElementById('ms-form-color').value = '#3b82f6';
        document.getElementById('ms-btn-cancel-edit').style.display = 'none';
        document.getElementById('ms-crud-title').innerText = 'Adicionar / Editar Elemento';
        document.getElementById('ms-crud-title').style.color = '#1e293b';

        document.getElementById('ms-box-select-cat').style.display = 'block';
        document.getElementById('ms-box-color').style.display = 'none';
        document.getElementById('ms-box-text').style.display = 'block';
        document.getElementById('ms-label-name').innerText = 'Nome da Frase / Título da Categoria';
    }

    function exportarConfigJSON() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obterCategorias(), null, 4));
        const exportAnchor = document.createElement('a');
        exportAnchor.setAttribute("href", dataStr);
        exportAnchor.setAttribute("download", "banco_respostas_suporte.json");
        document.body.appendChild(exportAnchor);
        exportAnchor.click();
        exportAnchor.remove();
    }

    function importarConfigJSON(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const parsed = JSON.parse(evt.target.result);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    localStorage.setItem('ms_categorias_v2', evt.target.result);
                    alert('Frases setoriais importadas com sucesso! Atualizando menu...');
                    location.reload();
                } else {
                    alert('Erro: O arquivo não está no formato correto da aplicação.');
                }
            } catch(err) {
                alert('Erro na leitura do arquivo JSON.');
            }
        };
        reader.readAsText(file);
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        inicializar();
    } else {
        window.addEventListener('DOMContentLoaded', inicializar);
    }
})();