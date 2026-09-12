
export default class LocalStorage {
    constructor(name) {
        this.local_storage_name = name;
    }

    delete() {
        localStorage.removeItem(this.local_storage_name);
    }

    save() {
        let data = [];
        document.querySelectorAll(".storage").forEach(function(element) {
            data.push(element.value);
        });
        localStorage.setItem(this.local_storage_name, JSON.stringify(data));
    }

    load() {
        if (localStorage.getItem(this.local_storage_name)) {
            const data = JSON.parse(localStorage.getItem(this.local_storage_name));
            document.querySelectorAll(".storage").forEach(function(element, index) {
                element.value = data[index];
                element.dispatchEvent(new Event('focusout'));
            });
        }
    }

    markGroup(id_parent) {
        const selector = `#${id_parent} *[type="text"], #${id_parent} textarea`;
        document.querySelectorAll(selector).forEach(function(element) {
            element.classList.add("storage");
        });
    }

    markElement(element) {
        element.classList.add("storage");
    }
}