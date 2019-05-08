'use strict';

var PersonInfo = function (text) {
    if(text){
            var o = JSON.parse(text);
            // 身份证号
            this.id = o.id;
            // 姓名
            this.name = o.name;
            // 是否有犯罪记录
            this.isCrime = o.isCrime;
    }else{
            this.id = "";
            this.name = "";
            this.isCrime = "false"
        }
};

PersonInfo.prototype = {
    toString: function () {
        return JSON.stringify(this);
    }
};

var PoliceContract = function () {
    LocalContractStorage.defineProperties(this, {
        admin: null,
        name: null
    });
    LocalContractStorage.defineMapProperty(this, "personInfo", {
        parse: function (text) {
            return new PersonInfo(text);
        },
        stringify: function (o) {
            return o.toString();
        }
    });
};

PoliceContract.prototype = {
    init: function() {
        this.admin = Blockchain.transaction.from;
    },
    checkPersonInfo: function(id, name, extraData) {
        var info = this.personInfo.get(id);
        if(!info) {
            return {
                valid: "false",
                isCrime: "",
                error: "id error"
            };
        }

        if(info.name != name) {
            return {
                valid: "false",
                isCrime: "",
                error: "name error"
            };
        }

        if(info.isCrime === "true") {
            Event.Trigger("findCrime", {
                findCrime: {
                    id: id,
                    name: name,
                    data: extraData
                }
            });
        }

        return {
            valid: "true",
            isCrime: info.isCrime,
            error: ""
        };
    },
    setPersonInfo: function(id, name, isCrime) {
        if (Blockchain.transaction.from !== this.admin) {
            throw new Error("only admin can set person info");
        }

        var info = new PersonInfo();
        info.id = id;
        info.name = name;
        info.isCrime = isCrime
        this.personInfo.put(id, info);
    }
}

module.exports = PoliceContract;