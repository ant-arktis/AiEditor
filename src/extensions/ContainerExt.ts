import {Node, mergeAttributes, wrappingInputRule} from '@tiptap/core';
// @ts-ignore
import markdownitContainer from "markdown-it-container";
import {createElement} from '../util/htmlUtil';
import tippy, {Instance} from "tippy.js";
import {InnerEditor} from "../core/AiEditor.ts";


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        container: {
            setContainer: (type: string) => ReturnType,
            toggleContainer: (type: string) => ReturnType,
            unsetContainer: () => ReturnType,
        };
    }
}


export interface ContainerColorItem {
    name: string,
    lightBgColor: string,
    lightBorderColor: string,
    darkBgColor: string,
    darkBorderColor: string,
}

const defaultColorItems = [
    {
        name: 'info',
        lightBgColor: '#eff1f3',
        lightBorderColor: '#D7DAE0',
        darkBgColor: '#2a2c30',
        darkBorderColor: '#333',
    },
    {
        name: 'warning',
        lightBgColor: '#fcf5e4',
        lightBorderColor: '#D7DAE0',
        darkBgColor: '#40361d',
        darkBorderColor: '#333',
    },
    {
        name: 'danger',
        lightBgColor: '#ffe7ea',
        lightBorderColor: '#D7DAE0',
        darkBgColor: '#46222a',
        darkBorderColor: '#333',
    },
] as ContainerColorItem[]


export interface ContainerOptions {
    classes: string[],
    HTMLAttributes: {
        [key: string]: any
    },
    colorItems: ContainerColorItem[],
}

export const containerInputRegex = /^:::([a-z]+)?[\s\n]$/

export const ContainerExt = Node.create<ContainerOptions>({
    name: 'container',
    group: 'block',
    content: 'block+',
    defining: true,

    addOptions() {
        return {
            classes: ['info', 'warning', 'danger'],
            HTMLAttributes: {
                class: 'container-wrapper',
            },
            colorItems: defaultColorItems,
        }
    },

    addStorage() {
        return {
            markdown: {
                serialize(state: any, node: any) {
                    state.write("::: " + (node.attrs.containerClass || "") + "\n");
                    state.renderContent(node);
                    state.flushClose(1);
                    state.write(":::");
                    state.closeBlock(node);
                },
                parse: {
                    setup: (markdownIt: any) => {
                        this.options.classes.forEach(className => {
                            markdownIt.use(markdownitContainer, className);
                        });
                    },
                }
            }
        }
    },

    addAttributes() {
        return {
            containerClass: {
                default: null,
                parseHTML: element => [...element.classList].find(className => this.options.classes.includes(className)),
                renderHTML: attributes => ({
                    'class': attributes.containerClass,
                }),
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[.container-wrapper]',
                getAttrs: element => {
                    const el = element as HTMLElement;
                    const classes = ["container-wrapper"].concat(this.options.classes);
                    return [...el.classList].find(className => classes.includes(className)) ? null : false
                },
            },
        ]
    },


    renderHTML({HTMLAttributes}) {
        const attrs = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes);
        if (attrs.containerClass && this.options.colorItems) {
            const colorItem = this.options.colorItems.find(item => item.name === attrs.containerClass)
            let theme = (this.editor as InnerEditor).aiEditor?.options?.theme
            if (colorItem) {
                if (theme === 'dark') {
                    attrs.style = `background-color: ${colorItem.darkBgColor}; border-color: ${colorItem.darkBorderColor}`
                } else {
                    attrs.style = `background-color: ${colorItem.lightBgColor}; border-color: ${colorItem.lightBorderColor}`
                }
            }
        }
        return ['div', attrs, 0]
    },


    addCommands() {
        return {
            setContainer: type => ({commands}) => {
                return commands.wrapIn(this.name, {containerClass: type})
            },
            toggleContainer: type => ({commands}) => {
                return commands.toggleWrap(this.name, {containerClass: type})
            },
            unsetContainer: () => ({commands}) => {
                return commands.lift(this.name)
            },
        }
    },

    addInputRules() {
        return [
            wrappingInputRule({
                find: containerInputRegex,
                type: this.type,
                getAttributes: match => {
                    return {
                        containerClass: match[1],
                    }
                },
            }),
        ]
    },

    addNodeView() {
        return ({node, editor}) => {
            const div = document.createElement('div')
            div.classList.add('container-wrapper')
            div.classList.add(node.attrs.containerClass)
            div.style.backgroundColor = node.attrs.bgColor
            div.style.borderColor = node.attrs.borderColor

            let contentDOM = div;
            let tippyInstance: Instance | null = null;

            if (editor.isEditable) {
                div.style.position = "relative"
                div.appendChild(createElement(`<div class="aie-container-tools">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 10.4967L11.0385 6.86202C11.1902 6.33099 11.7437 6.0235 12.2747 6.17522C12.6069 6.27014 12.8666 6.52981 12.9615 6.86202L14 10.4967V11.9967H14.7192C15.1781 11.9967 15.5781 12.309 15.6894 12.7542L17.051 18.2008C18.8507 16.7339 20 14.4995 20 11.9967C20 7.57841 16.4183 3.99669 12 3.99669C7.58172 3.99669 4 7.57841 4 11.9967C4 14.4995 5.14932 16.7339 6.94897 18.2008L8.31063 12.7542C8.42193 12.309 8.82191 11.9967 9.28078 11.9967H10V10.4967ZM12 19.9967C12.2415 19.9967 12.4813 19.986 12.7189 19.9649C13.6187 19.8847 14.4756 19.6556 15.2649 19.3023L13.9384 13.9967H10.0616L8.73514 19.3023C9.52438 19.6556 10.3813 19.8847 11.2811 19.9648C11.5187 19.986 11.7585 19.9967 12 19.9967ZM12 21.9967C6.47715 21.9967 2 17.5195 2 11.9967C2 6.47384 6.47715 1.99669 12 1.99669C17.5228 1.99669 22 6.47384 22 11.9967C22 17.5195 17.5228 21.9967 12 21.9967Z"></path></svg>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14L8 10H16L12 14Z"></path></svg>
</div>`))
                contentDOM = createElement(`<div></div>`) as HTMLDivElement;
                div.appendChild(contentDOM)
                let theme = (this.editor as InnerEditor).aiEditor?.options?.theme

                const createEL = () => {
                    const el = createElement(`<div>
<div class="aie-container-tools-body">
    <div>样式选择</div>
    <div class="aie-container-tools-body-color-items">${this.options.colorItems.map(item => {
                        const bgColor = theme === "dark" ? item.darkBgColor : item.lightBgColor;
                        return `<div class="aie-container-tools-body-color-box" data-name="${item.name}" style="background-color: ${bgColor};"></div>`
                    }).join("")}</div>
</div>`)
                    el.addEventListener("click", (e) => {
                        if (e.target instanceof HTMLElement && e.target.classList.contains("aie-container-tools-body-color-box")) {
                            editor.commands.updateAttributes(this.name, {
                                containerClass: e.target.getAttribute("data-name")
                            })
                        }
                    })
                    return el;
                }


                tippyInstance = tippy(div.querySelector(".aie-container-tools")!, {
                    content: createEL(),
                    appendTo: editor.options.element,
                    placement: 'bottom-end',
                    trigger: 'click',
                    interactive: true,
                    arrow: false,
                    offset: [8, 0],
                    aria: {
                        content: null,
                        expanded: false,
                    },
                });
            }

            return {
                dom: div,
                contentDOM: contentDOM,
                destroy() {
                    tippyInstance?.destroy();
                },
            }
        }
    }

});
