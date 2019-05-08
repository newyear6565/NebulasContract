'use strict';

var AgentContract = function () {
    LocalContractStorage.defineProperties(this, {
        admin: null,
        hotelAddr: null,
        agentName: null
    });
};

AgentContract.prototype = {
    init: function(hotelAddr, name) {
        this.admin = Blockchain.transaction.from;
        this.hotelAddr = hotelAddr;
        this.agentName = name;
    },
    updatePoliceContractAddress: function(address) {
        if (Blockchain.transaction.from !== this.admin) {
            throw new Error("only admin can set hotelContract Address");
        }
        this.hotelAddr = address;
    },
    getHotelRoomList: function() {
        var hotel  = new Blockchain.Contract(this.hotelAddr);
        return hotel.call("getRoomIdList")
    },
    checkRoomIsCanBook: function(roomId, date, personId, personName, valueTest) {
        var hotel  = new Blockchain.Contract(this.hotelAddr);
        var o = hotel.value(valueTest).call("checkRoomIsCanBook", roomId, date, personId, personName, valueTest);
        return {
            canbook: o.isEmpty,
            error: o.error,
            agent: this.agentName
        };
    }
}

module.exports = AgentContract;