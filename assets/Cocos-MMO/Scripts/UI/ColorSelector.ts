
import { _decorator, Component, Node, Slider, Sprite, Color } from 'cc';
import { EventDispatcher } from '../Helpers/EventDispatcher';
const { ccclass, property } = _decorator;

@ccclass('ColorSelector')
export class ColorSelector extends Component {
    
    public onColorChanged: EventDispatcher<Color> = new EventDispatcher<Color>("onColorChanged");

    @property({type:Slider})
    private rSlider: Slider = null;
    @property({type:Slider})
    private gSlider: Slider = null;
    @property({type:Slider})
    private bSlider: Slider = null;
    @property({type:Slider})
    private aSlider: Slider = null;

    @property({type:Sprite})
    private referenceImage: Sprite = null;

    public display(color: Color) {

        this.rSlider.progress = color.r / 255;
        this.gSlider.progress = color.g / 255
        this.bSlider.progress = color.b / 255;

        if(this.aSlider) {
            this.aSlider.progress = color.a;
        }

        this.onSliderUpdated();
    }

    public onSliderUpdated() {
        let color: Color = this.getColor();
        this.updateReferenceImage(color);

        this.onColorChanged.invoke(color);
    }

    private getValues(): number[] {
        if(!this.aSlider) {
            return [this.rSlider.progress * 255, this.gSlider.progress * 255, this.bSlider.progress * 255, 255];
        }
        else {
            return [this.rSlider.progress * 255, this.gSlider.progress * 255, this.bSlider.progress * 255, this.aSlider.progress * 255];
        }
    }

    private updateReferenceImage(color: Color) {
        
        this.referenceImage.color = color;
    }

    public getColor() {
        let color: number[] = this.getValues();

        return new Color(color[0], color[1], color[2], color[3]);
    }
}