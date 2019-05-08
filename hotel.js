
'use strict';

var RoomInfo = function (text) {
    if(text){
            var o = JSON.parse(text);
            // 房间号
            this.roomId = o.roomId;
            // 是否空置
            this.isEmpty = o.isEmpty;
            // 日期 YYYYMMDD
            this.date = o.date;
    }else{
            this.roomId = "";
            this.isEmpty = "true";
            this.date = ""
        }
};

var HotelContract = function () {
    LocalContractStorage.defineProperties(this, {
        // 合约发布者
        admin: null,
        // 酒店名字
        hotelName: null,
        // 创建日期 YYYYMMDD
        createdate: null,
        // 酒店房间列表 格式形如：101_102_103
        roomIdList: "",
        // 合约发布者
        policeContractAddress: null
    });
    LocalContractStorage.defineMapProperty(this, "roomInfo");
    LocalContractStorage.defineMapProperty(this, "roomId");
};

HotelContract.prototype = {
    init: function (name, date, policeContractAddress) {
        this.admin = Blockchain.transaction.from;
        this.hotelName = name;
        this.createdate = date;
        this.policeContractAddress = policeContractAddress;
    },
    updatePoliceContractAddress: function(address) {
        if (Blockchain.transaction.from !== this.admin) {
            throw new Error("only admin can set PoliceContract Address");
        }
        this.policeContractAddress = address;
    },
    updateRoomInfo: function(roomId, date, isEmpty) {
        if (Blockchain.transaction.from !== this.admin) {
            throw new Error("only admin can set room info");
        }
        var info = new RoomInfo();
        info.roomId = roomId;
        info.isEmpty = isEmpty;
        info.date = date
        this.roomInfo.put(roomId+date, info);

        Event.Trigger("updateRoomInfo", {
            updateRoomInfo: {
                roomId: roomId,
                date: date,
                isEmpty: isEmpty
            }
        });
    },
    updateRoomId: function(id) {
        if (Blockchain.transaction.from !== this.admin) {
            throw new Error("only admin can set room id");
        }
        this.roomId.put(id, "true");
        this.roomIdList = this.roomIdList + "_" + id;
    },
    getRoomIdList: function() {
        return this.roomIdList
    },
    checkRoomIsCanBook: function(roomId, date, personId, personName, valueTest) {
        if (date < this.createdate) {
            return {
                isEmpty: "",
                error: "date should be greater than " + this.createdate
            }
        }
        // 检查房间id是否存在
        var idValid = this.roomId.get(roomId);
        if(!idValid) {
            return {
                isEmpty: "",
                error: "room id not found"
            };
        }

        // 如果没有信息说明这天的房间可定
        var info = this.roomInfo.get(roomId+date);
        if(!info) {
            var infoNew = new RoomInfo();
            infoNew.roomId = roomId;
            infoNew.isEmpty = "true";
            infoNew.date = date
            this.roomInfo.put(roomId+date, infoNew);
        }

        var police  = new Blockchain.Contract(this.policeContractAddress);
        var personInfo = police.value(valueTest).call("checkPersonInfo", personId, personName, this.hotelName);
        if (personInfo.error !== "") {
            return {
                isEmpty: "",
                error: personInfo.error
            };
        }
        if (personInfo.isCrime === "true") {
            Event.Trigger("findCrime", {
                findCrime: {
                    personId: personId,
                    personName: personName
                }
            });
            return {
                isEmpty: "false",
                error: ""
            };
        }

        var roomInfo = this.roomInfo.get(roomId+date);
        return {
            isEmpty: roomInfo.isEmpty,
            error: ""
        }
    }
};

module.exports = HotelContract;