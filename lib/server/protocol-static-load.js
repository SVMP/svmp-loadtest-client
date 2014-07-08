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
 * @author Dave Bryson
 * @modified for static load tester Ivan Lozano
 *
 */

var
    protobuf = require("protobufjs"),
    ByteBuffer = require('bytebuffer'),
    path = require('path'),
    svmp = require('../svmp');

var protocol = exports;

/**
 * Load .proto file and configure
 */
protocol.init = function() {
    var builder = protobuf.loadProtoFile(path.join(__dirname, "../../protocol/svmp.proto"));
    this.Request = builder.build("svmp.Request");
    this.Response = builder.build("svmp.Response");

    // Hack to read Enums by the name.  Protobufjs doesn't support this natively
    this.requestEnums = toEnumLookup(builder.lookup("svmp.Request.RequestType").children);
    this.responseEnums = toEnumLookup(builder.lookup("svmp.Response.ResponseType").children);
};

/**
 * Decode an SVMP Request
 * @param msg
 * @returns {!protobuf.Builder.Message|*|protobuf.Builder.Message}
 */
protocol.parseRequest = function (msg) {
    var buf = ByteBuffer.wrap(msg);
    buf.readVarint();
    var request = this.Request.decode(buf);
    request.type = this.requestEnums[request.type];


    return request;
};

/**
 * Write a delimited message to Protobuf Request format
 * @param req in object format
 * @returns {*}
 */
protocol.writeRequest = function (req) {
    var protoMsg = new this.Request(req).encode();
    return writeDelimited(protoMsg);
};

/**
 * Decode a Protobuf response
 * @param msg
 * @returns {!protobuf.Builder.Message|*|protobuf.Builder.Message}
 */
protocol.parseResponse = function (msg) {
    var buf = ByteBuffer.wrap(msg);
    buf.readVarint();
    var response = this.Response.decode(buf);
    response.type = this.responseEnums[response.type];

    return response;
};

/**
 * Write a delimited message to Protobuf Response format
 * @param resp
 * @returns {*}
 */
protocol.writeResponse = function (resp) {


    var protoMsg = new this.Response(resp).encode();
    return writeDelimited(protoMsg);
};


function toEnumLookup(list) {
    var out = {};
    list.forEach(function (element, index, array) {
        out[element.id] = element.name;
    });
    return out;
}

function writeDelimited(protoMessage) {
    var msgSize = protoMessage.length;
    // TODO: The 1 below is not needed....
    var buffer = new ByteBuffer(1 + msgSize);
    buffer.writeVarint(msgSize);
    buffer.append(protoMessage);
    buffer.flip();
    return buffer.toBuffer();
}






