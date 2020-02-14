class QueryBuilder {
    constructor(model) {
        this.model = model;
        this.options = {};
    }



    withStatus(status = 1) {
    	this.options.status = status;
    	return this;
    }


    fisrt() {
        return this.model.findOne(this.options);
    }
    get() {
        return this.model.find(this.options);
    }
}