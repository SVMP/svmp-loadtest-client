/*
 * Copyright 2013-2014 The MITRE Corporation, All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this work except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Ivan Lozano
 */

//node libs
var net = require("net");
var fs = require('fs');

//Our libs
var svmp = require("./lib/svmp");
var proto = require("./lib/server/protocol-static-load");
var framedSocket = require("./lib/server/framedsocket");

//JSON Config
var server_list = require('./server_list.json');
var stun_server = server_list['stunServer'];

var ice_config = '{"iceServers":[{"url":"stun:' + stun_server + ':3478"}]}';
var vid_config ='{"audio":true,"video":{"mandatory":{},"optional":[]}}';
var pc_config = '{"optional":[{"DtlsSrtpKeyAgreement":true}]}';
var webrtc_config = { iceServers: ice_config, pcConstraints: pc_config, videoConstraints: vid_config };

//Initialization
proto.init();
var vmSocketList = [];
for(var i = 0; i < server_list['vmServers'].length; ++i){
    //Push new socket to list
    vmSocketList.push(framedSocket.wrap(new net.Socket()));
    
    //Setup callbacks
    vmSocketList[i].on('connect', function(d){
        console.log("Connected to " + this.remoteAddress + ":" + this.remotePort);
        this.write(proto.writeRequest({"type": "VIDEO_PARAMS", "videoInfo": webrtc_config}));
    });

    vmSocketList[i].on('data', function(d){
        console.log("Data incoming from " + this.remoteAddress + ":" + this.remotePort)
        console.log(proto.parseResponse(d));
    });
    vmSocketList[i].on('close', function(d){
        console.log("Socket closed from " + this.remoteAddress + ":" + this.remotePort);
        console.log(d);
    });

    //Connect
    vmSocketList[i].connect(server_list['vmServers'][i]['port'],server_list['vmServers'][i]['ip']);
}