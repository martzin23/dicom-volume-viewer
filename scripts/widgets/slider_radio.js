
export function createSliderRadio(set = (value) => {}, get = () => {}, name = "Slider Radio", values = [], labels = []) {
    const default_value = get();
    if (!values.indexOf(default_value)) throw new RangeError(`Default value ${default_value} not in value list: ${values}`);
    const RESOLUTION = values.length - 1;

    const element_slider = document.createElement("wa-slider");
    element_slider.classList = "wide";
    element_slider.setAttribute("min", "0");
    element_slider.setAttribute("max", RESOLUTION);
    element_slider.setAttribute("value", values.indexOf(default_value));
    element_slider.setAttribute("with-markers", true);
    element_slider.addEventListener("input", function() {
        const value = values[this.value];
        set(value);
    });
    element_slider.addEventListener("updategui", function() {
        this.value = (values.indexOf(get()) !== undefined) ? values.indexOf(get()) : values.indexOf(default_value);
    });

    for (const label of labels) {
        const span = document.createElement("span");
        span.setAttribute("slot", "reference");
        span.innerText = label;
        element_slider.appendChild(span);
    } 

    const element_name = document.createElement("p");
    element_name.innerText = name;

    const element_base = document.createElement("div");
    element_base.className = "slider-radio";
    element_base.appendChild(element_name);
    element_base.appendChild(element_slider);
    
    return element_base;
}
