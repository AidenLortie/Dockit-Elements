import {DockitElementRoot, Component, div, h1, button, span} from '../dist/index.js';



class MyComponent extends Component<{count: number}> {
    constructor(initial = 0) {
        super({count: initial});
        this.updateView()
    }
    renderView() {
        this.children = [
            h1(["Counter"]),
            button([
                span([`Count: ${this.props.count}`])],
                {
                    events: {
                        click: () => this.setState({count: this.state.count + 1})
                    }
                }
            )
        ];
    }
}

const app = new DockitElementRoot(document.getElementById('app')!, new MyComponent(0));
app.render();