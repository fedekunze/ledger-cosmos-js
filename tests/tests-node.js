/********************************************************************************
 *   Ledger Node JS App Tests
 *   (c) 2018 ZondaX GmbH
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ********************************************************************************/

var assert = require('assert');
var expect = require('chai').expect;
var Q = require('q');

ledger = require('../src');
comm = ledger.comm_node;
browser = false;

const TIMEOUT = 1000;
const LONG_TIMEOUT = 45000;
const EXPECTED_MAJOR = 1;
const EXPECTED_MINOR = 0;
const EXPECTED_PATCH = 1;

describe('get_version', function () {
    let response;
    // call API
    before(function () {
        return comm.create_async(TIMEOUT, true).then(
            function (comm) {
                let app = new ledger.App(comm);
                return app.get_version().then(function (result) {
                    response = result;
                    console.log(response);
                });
            });
    });
    it('return_code is 0x9000', function () {
        expect(response.return_code).to.equal(0x9000);
    });
    it('has property test_mode', function () {
        expect(response).to.have.a.property('test_mode');
    });
    it('has property major', function () {
        expect(response).to.have.a.property('major');
    });
    it('has property minor', function () {
        expect(response).to.have.a.property('minor');
    });
    it('has property patch', function () {
        expect(response).to.have.a.property('patch');
    });
    it('test_mode is disabled', function () {
        expect(response.test_mode).to.be.false;
    });
    it('app has matching version', function () {
        expect(response.major).to.equal(EXPECTED_MAJOR);
        expect(response.minor).to.equal(EXPECTED_MINOR);
        expect(response.patch).to.equal(EXPECTED_PATCH);
    });
});

describe('get_pk', function () {
    let response;
    // call API
    before(function () {
        return comm.create_async(TIMEOUT, true).then(
            function (comm) {
                let app = new ledger.App(comm);

                let path = [44, 118, 0, 0, 0];           // Derivation path. First 3 items are automatically hardened!
                return app.publicKey(path).then(function (result) {
                    response = result;
                    console.log(response);
                });

            });
    });
    it('return_code is 0x9000', function () {
        expect(response.return_code).to.equal(0x9000);
    });
    it('has property pk', function () {
        expect(response).to.have.a.property('pk');
    });
    it('has no errors', function () {
        expect(response.error_message).to.equal(`No errors`);
    });
    it('has 65 bytes', function () {
        expect(response.pk).to.have.lengthOf(65);
    });
});

describe('sign_get_chunks', function () {
    let chunks;

    // call API
    before(function () {
        return comm.create_async(TIMEOUT, true).then(
            function (comm) {
                let app = new ledger.App(comm);
                let path = [44, 118, 0, 0, 0];           // Derivation path. First 3 items are automatically hardened!
                let message = `{"account_number": 1,"chain_id": "some_chain","fee": {"amount": [{"amount": 10, "denom": "DEN"}],"gas": 5},"memo": "MEMO","msgs": ["SOMETHING"],"sequence": 3}`;

                chunks = app.sign_get_chunks(path, message);
            });
    });
    it('number of chunks 2', function () {
        expect(chunks.length).to.equal(2);
    });
    it('chunk 1 is derivation path', function () {
        expect(chunks[0].length).to.equal(1 + 5 * 4);
    });
    it('chunk 2 is message', function () {
        expect(chunks[1].length).to.equal(158);
    });
});

describe('sign_get_chunks_big', function () {
    let chunks;

    // call API
    before(function () {
        return comm.create_async(TIMEOUT, true).then(
            function (comm) {
                let app = new ledger.App(comm);
                let path = [44, 118, 0, 0, 0];           // Derivation path. First 3 items are automatically hardened!
                let message = Buffer.alloc(1234);

                chunks = app.sign_get_chunks(path, message);
            });
    });
    it('number of chunks 6', function () {
        expect(chunks.length).to.equal(6);
    });
    it('chunk 1 is derivation path', function () {
        expect(chunks[0].length).to.equal(1 + 5 * 4);
    });
    it('chunk 2 is message', function () {
        expect(chunks[1].length).to.equal(250);
    });
    it('chunk 3 is message', function () {
        expect(chunks[2].length).to.equal(250);
    });
    it('chunk 4 is message', function () {
        expect(chunks[3].length).to.equal(250);
    });
    it('chunk 5 is message', function () {
        expect(chunks[4].length).to.equal(250);
    });
    it('chunk 6 is message', function () {
        expect(chunks[5].length).to.equal(234);
    });
});

describe('sign_send_chunk', function () {
    let response;

    // call API
    before(function () {
        return comm.create_async(TIMEOUT, true).then(
            function (comm) {
                let app = new ledger.App(comm);
                let path = [44, 118, 0, 0, 0];           // Derivation path. First 3 items are automatically hardened!
                let message = `{"account_number": 1,"chain_id": "some_chain","fee": {"amount": [{"amount": 10, "denom": "DEN"}],"gas": 5},"memo": "MEMO","msgs": ["SOMETHING"],"sequence": 3}`;
                let chunks = app.sign_get_chunks(path, message);

                app.sign_send_chunk(1,2, chunks[0]).then(function (result) {
                    response = result;
                    console.log(response);
                });
            });
    });
    it('return_code is 0x9000', function () {
        expect(response.return_code).to.equal(0x9000);
    });
});

describe('sign', function () {
    let response;

    // call API
    before(function () {
        this.timeout(LONG_TIMEOUT);
        return comm.create_async(LONG_TIMEOUT, true).then(
            async function (comm) {
                let app = new ledger.App(comm);
                let path = [44, 118, 0, 0, 0];           // Derivation path. First 3 items are automatically hardened!
                let message = `{"account_number":1,"chain_id":"some_chain","fee":{"amount":[{"amount":10,"denom":"DEN"}],"gas":5},"memo":"MEMO","msgs":["SOMETHING"],"sequence":3}`;

                response = await app.sign(path, message);
                console.log(response);
            });
    });
    it('return_code is 0x9000', function () {
        expect(response.return_code).to.equal(0x9000);
    });
    it('has no errors', function () {
        expect(response.error_message).to.equal(`No errors`);
    });
    it('return_code is 0x9000', function () {
        expect(response.signature.length).to.equal(71);
    });
});

describe('sign_2', function () {
    let response;

    // call API
    before(function () {
        this.timeout(LONG_TIMEOUT);
        return comm.create_async(LONG_TIMEOUT, true).then(
            async function (comm) {
                let app = new ledger.App(comm);
                let path = [44, 118, 0, 0, 0];           // Derivation path. First 3 items are automatically hardened!
                let message = `{"account_number":"2","chain_id":"local-testnet","fee":{"amount":[],"gas":"500000"},"memo":"","msgs":[{"description":"test","initial_deposit":[{"amount":"1","denom":"stake"}],"proposal_type":"Text","proposer":"cosmos13xzqf9re68eeqfjaxhqh6g5rqfvhzpfkm8tuhh","title":"test"}],"sequence":"0"}`;

                response = await app.sign(path, message);
                console.log(response);
            });
    });
    it('return_code is 0x9000', function () {
        expect(response.return_code).to.equal(0x9000);
    });
    it('has no errors', function () {
        expect(response.error_message).to.equal(`No errors`);
    });
    it('has 71 bytes', function () {
        expect(response.signature.length).to.equal(71);
    });
});

