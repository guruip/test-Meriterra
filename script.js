class ArrangeBox {
    containerElement;

    boxLeftElement;
    boxRightElement;

    controlsRightElement;
    controlsLeftElement;
    controlsCenterElement;
    testControlsElement;

    boxLeftState;
    boxRighState;

    sourceState = {
        availableItems: [],
        selectedItems: [],
    }

    constructor({
        availableItems = [],
        selectedItems = [],
        testControlsEnabled = false,
    }) {
        this.sourceState.availableItems = this.copyItems(availableItems);
        this.sourceState.selectedItems = this.copyItems(selectedItems);

        this.boxLeftState = this.createBoxState(this.copyItems(availableItems));
        this.boxRightState = this.createBoxState(this.copyItems(selectedItems));

        this.boxLeftElement = this.createBoxElement('Доступные', this.boxLeftState);
        this.boxRightElement = this.createBoxElement('Выбранные', this.boxRightState);

        this.controlsLeftElement = this.createControlsElement(this.boxLeftState, this.boxLeftElement);
        this.controlsRightElement = this.createControlsElement(this.boxRightState, this.boxRightElement);
        this.controlsCenterElement = this.createCenterControlsElement();

        this.testControlsElement = testControlsEnabled ? this.createTestControlsElement() : '';

        this.containerElement = this.createElement('div', {
            className: 'arrange-box'
        }, [
            this.controlsLeftElement,
            this.boxLeftElement,
            this.controlsCenterElement,
            this.boxRightElement,
            this.controlsRightElement,
            this.testControlsElement,
        ]);
    }

    copyItems(items) {
        return JSON.parse(JSON.stringify(items));
    }

    mount(selector) {
        document.querySelector(selector).appendChild(this.containerElement);
    }

    resetSearchValue(state, boxElement) {
        state.searchValue = '';
        boxElement.querySelector('input').value = '';
    }

    setItems(state, items) {
        state.setItems(this.copyItems(items));
    }

    setItemsForLeftBox(items) {
        this.setItems(this.boxLeftState, items);
        this.repaintBoxItemElements(this.boxLeftState, this.boxLeftElement);
    }

    setItemsForRightBox(items) {
        this.setItems(this.boxRightState, items);
        this.repaintBoxItemElements(this.boxRightState, this.boxRightElement);
    }

    resetState() {
        this.setItems(this.boxLeftState, this.sourceState.availableItems);
        this.setItems(this.boxRightState, this.sourceState.selectedItems);
        this.resetSearchValue(this.boxLeftState, this.boxLeftElement);
        this.resetSearchValue(this.boxRightState, this.boxRightElement);
        this.repaintBoxItemElements(this.boxLeftState, this.boxLeftElement);
        this.repaintBoxItemElements(this.boxRightState, this.boxRightElement);
    }

    createBoxElement(title, state) {
        const createList = state => state.items.map(item => this.createBoxItemElement(item));
        const ulElement = this.createElement('ul', {}, createList(state));
        const inputElement = this.createElement('input', {
            type: 'search', placeholder: 'Поиск по имени'
        });
        const containerElement = this.createElement('section', {
            className: 'arrange-box-list'
        }, [
            this.createElement('header', {
                className: 'arrange-box-list__header',
            },
                [
                    this.createElement('h3', {}, [title])
                ]),
            this.createElement('div', {
                className: 'arrange-box-list__search',
            },
                [
                    inputElement,
                ]),
            this.createElement('main', {
                className: 'arrange-box-list__main',
            },
                [
                    ulElement,
                ]),
        ]);

        containerElement.addEventListener('click', ({ target }) => {
            const itemElement = this.findBoxItemElement(target, containerElement);

            if (!itemElement) return;

            const allItems = [...this.boxLeftState.items, ...this.boxRightState.items];
            const item = allItems.find(item => item.id === +itemElement.dataset.id);

            if (!item) return;

            item.isSelected = !item.isSelected;
            itemElement.classList.toggle('arrange-box-list__item_selected');
        });

        inputElement.addEventListener('input', (event) => {
            state.onSearch(event.target.value);
            ulElement.replaceChildren(...createList(state));
        });

        return containerElement;
    }

    createTestControlsElement() {
        const buttonClear = this.createControlButton('Сбросить');
        const buttonSetLeft = this.createControlButton('Установить слева');
        const buttonSetRight = this.createControlButton('Установить справа');
        const buttonAddArrangeBox = this.createControlButton('Добавить компонент');

        buttonClear.addEventListener('click', () => this.resetState());

        buttonSetLeft.addEventListener('click', () => {
            this.setItemsForLeftBox([
                {
                    title: 'Left',
                    color: '#ccc',
                    isSelected: false,
                    id: 1000
                }
            ]);
        });

        buttonSetRight.addEventListener('click', () => {
            this.setItemsForRightBox([
                {
                    title: 'Right',
                    color: '#ccc',
                    isSelected: false,
                    id: 1001
                }
            ]);
        });

        buttonAddArrangeBox.addEventListener('click', () => {
            new ArrangeBox({
                availableItems: this.sourceState.availableItems,
                selectedItems: this.sourceState.selectedItems,
                testControlsEnabled: true,
            }).mount('.container');
        });

        return this.createElement('div', {
            className: 'arrange-box-test-controls'
        }, [
            buttonClear,
            buttonSetLeft,
            buttonSetRight,
            buttonAddArrangeBox,
        ]);
    }

    findBoxItemElement(element, root) {
        const id = Number(element.dataset.id);

        if (element === root) return null
            ;
        return isNaN(id)
            ? this.findBoxItemElement(element.parentElement, root)
            : element;
    }

    createControlButton(symbol) {
        return this.createElement('button', {
            className: 'arrange-box-controls__item'
        }, [
            symbol
        ]);
    }

    createCenterControlsElement() {
        const buttonNext = this.createControlButton('→');
        const buttonToRight = this.createControlButton('⇉');
        const buttonPrev = this.createControlButton('←');
        const buttonToLeft = this.createControlButton('⇇');

        const moveItems = (items, sourceState, targetState) => {
            items.forEach((i) => i.isSelected = false);
            sourceState.removeItems(items);
            targetState.addItems(items);
            this.repaintBoxItemElements(this.boxLeftState, this.boxLeftElement);
            this.repaintBoxItemElements(this.boxRightState, this.boxRightElement);
        };

        buttonNext.addEventListener('click', () => moveItems(this.boxLeftState.selectedItems, this.boxLeftState, this.boxRightState));
        buttonPrev.addEventListener('click', () => moveItems(this.boxRightState.selectedItems, this.boxRightState, this.boxLeftState));
        buttonToRight.addEventListener('click', () => moveItems(this.boxLeftState.items, this.boxLeftState, this.boxRightState));
        buttonToLeft.addEventListener('click', () => moveItems(this.boxRightState.items, this.boxRightState, this.boxLeftState));

        return this.createElement('section', {
            className: 'arrange-box-controls',
        }, [
            buttonNext,
            buttonToRight,
            buttonPrev,
            buttonToLeft
        ]);
    }

    createControlsElement(state, boxElement) {
        const buttonUp = this.createControlButton('↑');
        const buttonToTop = this.createControlButton('⇈');
        const buttonDown = this.createControlButton('↓');
        const buttonToBottom = this.createControlButton('⇊');

        const moveItems = (moveFn) => {
            moveFn();
            this.repaintBoxItemElements(state, boxElement);
        };

        buttonUp.addEventListener('click', () => moveItems(() => state.upSelectedItems()));
        buttonDown.addEventListener('click', () => moveItems(() => state.downSelectedItems()));
        buttonToTop.addEventListener('click', () => moveItems(() => state.moveToSelectedItems('top')));
        buttonToBottom.addEventListener('click', () => moveItems(() => state.moveToSelectedItems('bottom')))

        return this.createElement('section', {
            className: 'arrange-box-controls',
        }, [
            buttonUp,
            buttonToTop,
            buttonDown,
            buttonToBottom
        ]);
    }

    repaintBoxItemElements(state, boxElement) {
        const ulElement = boxElement.querySelector('ul');
        const boxItemElements = state.items.map(item => this.createBoxItemElement(item));

        ulElement.replaceChildren(...boxItemElements);
    }

    createBoxItemElement(item) {
        const classList = ['arrange-box-list__item'];

        if (item.isSelected) {
            classList.push('arrange-box-list__item_selected');
        }


        return this.createElement('li', {
            className: classList.join(' '),
            ['data-id']: item.id,
        }, [
            this.createElement('div', {
                className: 'arrange-box-list__item-block',
                style: `background-color: ${item.color};`,
            }),
            this.createElement('p', {
                className: 'arrange-box-list__item-title',
            }, [
                item.title
            ])
        ]);
    }

    createElement(tagName, attributes = {}, children = []) {
        const element = document.createElement(tagName);

        if (typeof attributes === 'object' && attributes !== null) {
            Object.keys(attributes).forEach(attr => {
                element.setAttribute(attr === 'className' ? 'class' : attr, attributes[attr]);
            });
        }

        if (Array.isArray(children) && children.length) {
            element.append(...children);
        }

        return element;
    }

    createBoxState(items = [], searchValue = '') {
        class BoxState {
            #inputItems = [];
            searchValue = '';

            get items() {
                return this.#filteredItems;
            }

            get selectedItems() {
                return this.#inputItems.filter(item => item.isSelected);
            }

            get #filteredItems() {
                return this.searchValue.length
                    ? this.#inputItems.filter(i => i.title.toLowerCase().includes(this.searchValue.toLowerCase()))
                    : this.#inputItems;
            }

            constructor(items) {
                this.#inputItems = items;
                this.onSearch(searchValue);
            }

            setItems(items) {
                this.#inputItems = items;
            }

            removeItems(items) {
                if (!items.length) {
                    return;
                }

                this.#inputItems = this.#inputItems.filter(({ id }) => !items.find(i => i.id === id));
            }

            addItems(items) {
                if (!items.length) {
                    return;
                }

                this.#inputItems.push(...items);
            }

            onSearch(searchValue) {
                this.searchValue = searchValue;
            }

            getItem(id) {
                return this.items.find(i => i.id === id);
            }

            upSelectedItems() {
                for (const selectedItem of this.selectedItems) {
                    const itemIndex = this.#inputItems.findIndex(item => item.id === selectedItem.id);

                    if (itemIndex === 0) {
                        return;
                    }

                    const prevItem = this.#inputItems[itemIndex - 1];

                    this.#inputItems[itemIndex - 1] = selectedItem;
                    this.#inputItems[itemIndex] = prevItem;
                }
            }

            moveToSelectedItems(to = 'top') {
                const selectedItems = [];
                const restItems = [];

                for (const item of this.#inputItems) {
                    if (this.selectedItems.find(({ id }) => id === item.id)) {
                        selectedItems.push(item);
                    } else {
                        restItems.push(item);
                    }
                }

                switch (to) {
                    case 'top': this.#inputItems = [...selectedItems, ...restItems]; break;
                    case 'bottom': this.#inputItems = [...restItems, ...selectedItems]; break;
                }
            }

            downSelectedItems() {
                for (const selectedItem of this.selectedItems.reverse()) {
                    const itemIndex = this.#inputItems.findIndex(item => item.id === selectedItem.id);

                    if (itemIndex === this.#inputItems.length - 1) {
                        return;
                    }

                    const nextItem = this.#inputItems[itemIndex + 1];

                    this.#inputItems[itemIndex + 1] = selectedItem;
                    this.#inputItems[itemIndex] = nextItem;
                }
            }
        }

        return new BoxState(items);
    }

}

(() => {
    const availableItems = [
        {
            id: 1,
            title: 'Red',
            color: 'red',
            isSelected: false,
        },
        {
            id: 2,
            title: 'Orange',
            color: 'orange',
            isSelected: false,
        },
        {
            id: 3,
            title: 'Yellow',
            color: 'yellow',
            isSelected: false,
        },
        {
            id: 4,
            title: 'Green',
            color: 'green',
            isSelected: false,
        },
        {
            id: 5,
            title: 'Blue',
            color: 'blue',
            isSelected: false,
        },
        {
            id: 6,
            title: 'Dark-blue',
            color: 'dark-blue',
            isSelected: false,
        },
        {
            id: 7,
            title: 'Purple',
            color: 'purple',
            isSelected: false,
        },
    ];

    const selectedItems = [
        {
            id: 15,
            title: 'Blue',
            color: 'blue',
            isSelected: false,
        },
        {
            id: 16,
            title: 'Dark-blue',
            color: 'dark-blue',
            isSelected: false,
        },
        {
            id: 17,
            title: 'Purple',
            color: 'purple',
            isSelected: false,
        },
    ]

    new ArrangeBox({ availableItems, selectedItems, testControlsEnabled: true }).mount('.container');
})();