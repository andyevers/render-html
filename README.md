# RenderHTML
Generate HTML from JavaScript Objects. With RenderHTML, you can easily:
* Create Elements
* Add Attributes
* Add Event Listeners


```HTML
<!-- This code inside render() -->
<script>
$("div", { class: "my-class" })._(
    $("a", { href: "#" })._("Click Here!")
)
</script>

<!-- Produces this: -->
<div class="my-class">
    <a href="#">Click Here!</a>
</div>
```

## Usage
Here's a basic example of a class:
```JS
class MyClass extends RenderHTML {
    constructor(link, output) {
        super(output) 
        this.link = link
        this.init()
    }
    render() {
        const $ = this.$

        $("div", { class: "my-class" })._(
            $("a", { href: this.link })._("Click Here!")
        )
    }
}
```

## Methods & Properties

### Methods
* `render()` - All HTML to be created goes in here.
* `init()` Activates the __render()__ method and appends the element(s) to output if defined.
* `$(tagName = String, attributes = Object, events = Function/Array)` - only used inside __render()__. Used for creating elements & adding event listeners
* `e(eType = String, func = Function)` - only used in __render()__. Used in third argument of __$()__ to add event listeners

### Properties
* `output {Node}` - Optional container defined in constructor that elements will append to.
* `element {Node}` - If all html has one common parent, returns that common parent.
* `elements {Object}` - Holds all nodes that are rendered with attribute ___key__ elements accessible through this.elements[*_key*].
* `topLevelEls {Array}` - Holds elements that do not have any parent node. only necessary if there is more than one element without a parent, otherwise use this.element.
* `isInitialized {Bool}` - True when the class has successfully initialized.
* `_renderData {Object}` - Holds element data before rendering

<br>

## Rendering

* __$()__: for creating elements
* __e()__: adding event listeners
* ___()__: adding child elements / innerHTML (method returned by __$()__)
* ___key__: added to attributes inside __$()__ to access in this.elements[*_key*]

## Example Script

```JS
// This is an array of post data that will be used to make the featured posts
const POST_DATA = [
    {
        title: "I Love RenderHTML!",
        description: "This is the most handy dandy script that you'll find for creating HTML with JavaScript. no more createElement & setAttribute nonsense!",
        image: "http://picsum.photos/id/0/380/250",
        link: "https://github.com/andyevers/render-html/"
    },
    {
        title: "The Adventures of Mittens' Kittens",
        description: "Mittens goes on a quest with the kittens from down the street to find the magic yarnball. He soon finds himself in an unexpected friendship with a stray calico.",
        image: "http://picsum.photos/id/40/380/250",
        link: "https://guides.github.com/"
    },
    {
        title: "Who Really Ate Gilbert's Grapes?",
        description: "We debunk the truth of this famous question and all the mysteries that surround it. Where did Gilbert get the grapes? Why did someone eat them?",
        image: "http://picsum.photos/id/23/380/250",
        link: "https://guides.github.com/activities/socialize/"
    }
]

// Define your class extending the RenderHTML class
class FeaturedPost extends RenderHTML {
    constructor(data, output) {
        super(output) // container HTML will append to after render()
        this.title = data.title
        this.description = data.description
        this.image = data.image
        this.link = data.link

        this.logImageElement = () => {
            console.log(this.elements.imageElement)
        }

        this.init()
    }

    render() {
        const $ = this.$ // creates elements
        const e = this.e // add event listeners

        //This will be the output HTML for your post data
        $("div", { class: "post-item" })._( //accessible using this.element

            // use "_key" to access element by this.elements.imageElement
            $("img", { _key: "imageElement", src: this.image }), 
            $("div", { class: "post-details", style: "color: #333;" })._(

                // logImageElement function fires when title is clicked
                $("h3", {}, e("click", this.logImageElement))._(this.title), 
                
                $("p")._(this.description)
            ),

            $("a", { href: this.link, target: "_blank" })._("Read More")
        )
    }
}

const output = document.getElementById("output")

//create the posts
for (let post of POST_DATA) {
    let postElement = new FeaturedPost(post, output)
    console.log("created element:", postElement.element)
}
```
see the result of this script in: `/examples/featured-posts.html`
