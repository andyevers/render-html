
class RenderHTML {
    /**
     * @param {Node} output: optional container that elements will append to
     */
    constructor(output) {
        this.output = output
        this.elements = null // Object: holds all nodes that are rendered with attribute "_key" elements accessible through this.elements[key]
        this.topLevelEls = null // Array: holds elements that do not have any parent node. only necessary if there is more than one element without a parent, othewise use this.element
        this.isInitialized = false // Bool: true when the class has successfully initialized
        this._renderData = {} // Object: holds element data before rendering
        this._renderFunctions = [] // Array: holds objects containing functions that will be fired during rendering, used to assign the generated HTML to a parent

        // RENDER FUNCTIONS________________________________

        // create elements with $() and add children with _()
        this.$ = (tagName, attributes, events) => {

            function randId(length = 20) { // used for generating renderData keys & data-renderids
                const lib = "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890"
                var str = ""
                for (var i = 0; i < length; i++) {
                    str += lib[Math.floor(Math.random() * lib.length)]
                }
                return str
            }

            const id = randId()
            const renderer = this
            this._renderData[id] = { // data used to generate elements

                id: id,
                attributes: attributes,
                tagName: tagName,
                childIds: [],
                parentId: null,
                isRendered: false,
                isSVG: false,
                childPosition: null,
                events: events,

                _: function () {

                    // move through each argument to store data in this._renderData object
                    let i = 0
                    Array.from(arguments).forEach(data => {
                        //data.childPosition = i // tells the order the child should be rendered in, otherwise using this.f() will mess up the order

                        let parent = renderer._renderData[id]


                        if (!data) {
                            return
                            // this will happen if the variable was found undefined
                        }

                        if (data.isRenderFunction === true) {
                            data.childPosition = i // tells the order the child should be rendered in, otherwise using this.f() will mess up the order
                            data.parentId = id
                            renderer._renderFunctions.push(data)
                            return
                        }
                        // html string stored as array to distinguish them from nodes
                        if (typeof data === "string" || typeof data === "number") parent.childIds.push([data])

                        else if (data.id) {
                            data.childPosition = i
                            let childId = data.id
                            let child = renderer._renderData[childId]

                            parent.childIds.push(childId)
                            child.parentId = id
                        }
                        else {
                            console.error(`could not handle data for: ${data}`)
                        }
                        i++
                    })
                    return this // allows for reuse of the function _()
                }
            }
            return this._renderData[id]
        }

        this.f = func => { // allows adding functions inside rendering
            return {
                isRenderFunction: true,
                isRendered: false,
                parentId: null,
                func: func
            }
        }

        this.e = (eType, func) => [eType, func] // used in 3rd arg in $() for adding event listeners
        // /RENDER FUNCTIONS________________________________

        this.init = () => {

            let prepDiv = null
            let renderData = this._renderData
            let renderFunctions = this._renderFunctions

            function createChildren(data) { // creates els by moving through [children] array

                sortChildren(data) // makes sure child els rendered in the correct order
                let parentEl = prepDiv.querySelector(`[data-renderid='${data.id}']`)
                data.childIds.forEach(cid => {

                    if (Array.isArray(cid)) { // checks if it is html string or element data
                        let html = cid[0]
                        parentEl.innerHTML += html

                    } else { // creates el from renderData, then repeats this function on each child

                        let child = renderData[cid]
                        if (isSVG(child)) child.isSVG = true
                        let { id, tagName, attributes, events } = child,
                            el = createEl(id, tagName, attributes)

                        if (events) applyEvents(el, events) // add event listeners

                        parentEl.appendChild(el)
                        child.isRendered = true
                        createChildren(child)
                    }
                })
            }

            function applyEvents(el, events) {

                const applyEvent = (el, ev) => {
                    let eType = ev[0],
                        func = ev[1]
                    el.addEventListener(eType, func)
                }

                if (Array.isArray(events[0])) events.forEach(ev => applyEvent(el, ev))
                else applyEvent(el, events)
            }

            function getElKeys(topLevelEls) { // extract "_key" attribute from element to access it with "this.elements[_key]"
                var elKeys = {}

                const extractKey = el => {
                    let key = el.getAttribute("_key")
                    if (key) {
                        elKeys[key] = el
                        el.removeAttribute("_key")
                    }
                }

                const addChildKeys = el => {
                    Array.from(el.children).forEach(c => {
                        extractKey(c)
                        Array.from(c.children).forEach(c2 => addChildKeys(c2))
                    })
                }

                topLevelEls.forEach(tlEl => {
                    extractKey(tlEl)
                    addChildKeys(tlEl)
                })
                return elKeys
            }

            function createEl(dataId, tagName, attributes = {}) { // generates element with temporary data-renderid for rendering
                // anything with the tagName "svg" or has a parent with tagName "svg" will be render with svg namespace
                let isSVG = renderData[dataId] && renderData[dataId].isSVG === true
                let el = isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tagName) : document.createElement(tagName)
                for (let [attr, val] of Object.entries(attributes)) {
                    el.setAttribute(attr, val)
                }
                el.setAttribute("data-renderid", dataId)
                return el
            }

            function prepareElements() { // builds element tree in temporary div before adding them to output container

                const topLevelEls = Object.values(renderData).filter(d => d.parentId === null)
                prepDiv = createEl("div")

                //starts at top level elements them moves down the tree
                topLevelEls.forEach(data => {
                    if (isSVG(data)) data.isSVG = true
                    let { id, tagName, attributes, events } = data
                    let el = createEl(id, tagName, attributes)
                    if (events) applyEvents(el, events)

                    prepDiv.appendChild(el)
                    data.isRendered = true
                    createChildren(data)
                })

                //remove data-renderids after structure is created
                prepDiv.querySelectorAll("[data-renderid]").forEach(el => el.removeAttribute("data-renderid"))
            }

            function sortChildren(renderDataItem) {
                if (renderDataItem.childIds.length <= 1) return

                renderDataItem.childIds.sort((idA, idB) => {
                    let posA = renderData[idA].childPosition
                    let posB = renderData[idB].childPosition
                    return posA < posB ? -1 : 1
                })
            }

            function runRenderFunctions() { // run functions inside this._renderFunctions and puts them in this._renderData 

                const removeArrayValues = (arr, valuesToRemove) => arr.filter(val => !valuesToRemove.includes(val))
                const matchParentData = (renderKeys, parentId, childPosition) => {
                    renderKeys.forEach(key => {
                        if (!renderData[key].parentId) {
                            renderData[key].parentId = parentId
                            renderData[parentId].childIds.splice(childPosition, 0, key)
                        }
                    })
                }
                for (let obj of renderFunctions) {
                    // run the renderFunctions and add parentId to all the newly added top level renderData
                    let oldRenderKeys = Object.keys(renderData)
                    obj.func()
                    let newRenderKeys = removeArrayValues(Object.keys(renderData), oldRenderKeys)
                    matchParentData(newRenderKeys, obj.parentId, obj.childPosition)
                    obj.isRendered = true
                }
            }

            function isSVG(renderDataItem) { // checks if has svg tag or has a parent with isSVG === true
                let renderParent = renderData[renderDataItem.parentId]
                if (renderDataItem.tagName === "svg" || renderParent && renderParent.isSVG === true) return true
            }

            if (this.render) this.render()
            else return void console.error("You must define the render() function of your RenderHTML class to initialize")
            runRenderFunctions()
            prepareElements()

            this.topLevelEls = Array.from(prepDiv.children)
            this.elements = getElKeys(this.topLevelEls)

            // add elements to output container
            if (this.output) this.topLevelEls.forEach(c => this.output.appendChild(c))
            this.isInitialized = true
        }
    }

    get element() { // if all html has one common parent, the common parent will be accessible using this.element
        if (this.topLevelEls.length === 1) return this.topLevelEls[0]
        else return void console.error("you can only get the element if rendered HTML all has one common parent")
    }
}
