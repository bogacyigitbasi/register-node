"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var web_sdk_1 = require("@concordium/web-sdk");
var nodejs_1 = require("@concordium/web-sdk/nodejs");
var grpc_js_1 = require("@grpc/grpc-js");
var client = new nodejs_1.ConcordiumGRPCNodeClient("node.testnet.concordium.com", Number(20000), grpc_js_1.credentials.createInsecure());
/**
 * The following example demonstrates how a simple transfer can be created.
 */
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var walletExport, sender, toAddress, nextNonce, header, simpleTransfer, accountTransaction, signer, signature, transactionHash, status;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                walletExport = (0, web_sdk_1.parseWallet)("4XX5awarDkG69YwHFH5fgMKf4gEF3EtNkL3dvQoS8e8xRDi4oi.export");
                sender = web_sdk_1.AccountAddress.fromBase58(walletExport.value.address);
                toAddress = web_sdk_1.AccountAddress.fromBase58("3cjyrQGq7mKF4PwSKv2rMnWbHE7wUKmDCeyoJ3DWztqyAVA98P");
                return [4 /*yield*/, client.getNextAccountNonce(sender)];
            case 1:
                nextNonce = _a.sent();
                header = {
                    expiry: web_sdk_1.TransactionExpiry.futureMinutes(60),
                    nonce: nextNonce.nonce,
                    sender: sender
                };
                simpleTransfer = {
                    amount: web_sdk_1.CcdAmount.fromMicroCcd(1000),
                    toAddress: toAddress,
                    memo: new web_sdk_1.DataBlob(Buffer.from("", 'hex'))
                };
                accountTransaction = {
                    header: header,
                    payload: simpleTransfer,
                    type: web_sdk_1.AccountTransactionType.Transfer
                };
                signer = (0, web_sdk_1.buildAccountSigner)(walletExport);
                return [4 /*yield*/, (0, web_sdk_1.signTransaction)(accountTransaction, signer)];
            case 2:
                signature = _a.sent();
                return [4 /*yield*/, client.sendAccountTransaction(accountTransaction, signature)];
            case 3:
                transactionHash = _a.sent();
                return [4 /*yield*/, client.waitForTransactionFinalization(transactionHash)];
            case 4:
                status = _a.sent();
                console.dir(status, { depth: null, colors: true });
                return [2 /*return*/];
        }
    });
}); })();
