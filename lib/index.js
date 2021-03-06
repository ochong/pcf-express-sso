"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_fetch_1 = __importDefault(require("node-fetch"));
var simple_oauth2_1 = __importDefault(require("simple-oauth2"));
var log = __importStar(require("./logger"));
var SSOClient = /** @class */ (function () {
    function SSOClient(app) {
        this.bypass = false;
        this.ssoPaths = {
            authorizePath: "/oauth/authorize",
            tokenHost: "",
            tokenPath: "/oauth/token",
        };
        this.credentials = {
            id: "",
            secret: "",
        };
        this.clientPaths = {
            clientCallback: "/callback",
            clientHost: "",
        };
        this.userInfoPath = "/userinfo";
        this.scopes = ["openid"];
        this.oauth2 = undefined;
        this.authURI = "";
        this.app = app;
    }
    SSOClient.parseJSONString = function (s) {
        var response = {};
        try {
            response = JSON.parse(s);
        }
        catch (err) {
            console.error(err);
        }
        return response;
    };
    SSOClient.extractIdentity = function (VCAP) {
        var response = {
            auth_domain: "",
            client_id: "",
            client_secret: "",
        };
        if (VCAP["p-identity"] && VCAP["p-identity"][0]) {
            response = VCAP["p-identity"][0].credentials;
        }
        return response;
    };
    SSOClient.prototype.setAppScopes = function (scopes) {
        this.scopes = scopes;
    };
    SSOClient.prototype.getAppScopes = function () {
        return this.scopes;
    };
    SSOClient.prototype.middleware = function (req, res, next) {
        if (req.session && req.session.authorized || this.bypass) {
            next();
        }
        else {
            res.redirect(this.authURI);
        }
    };
    SSOClient.prototype.initialize = function (enabled) {
        var _this = this;
        if (enabled && process.env.VCAP_APPLICATION && process.env.VCAP_SERVICES) {
            this.setPathsFromVCAP(SSOClient.parseJSONString(process.env.VCAP_APPLICATION), SSOClient.parseJSONString(process.env.VCAP_SERVICES));
            this.oauth2 = simple_oauth2_1.default.create({
                auth: this.ssoPaths,
                client: this.credentials,
            });
            this.authURI = this.oauth2.authorizationCode.authorizeURL({
                redirectURI: this.clientPaths.clientHost + "/callback",
            });
            this.app.get("/callback", function (req, res) {
                _this.callback(req, res);
            });
        }
        else {
            this.bypass = true;
        }
    };
    SSOClient.prototype.setPathsFromVCAP = function (_a, VCAP_SVC) {
        var uris = _a.uris;
        var services = SSOClient.extractIdentity(VCAP_SVC);
        this.ssoPaths.tokenHost = services.auth_domain;
        this.credentials.id = services.client_id;
        this.credentials.secret = services.client_secret;
        this.clientPaths.clientHost = "https://" + (uris ? uris[0] : "127.0.0.1");
    };
    SSOClient.prototype.callback = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var options, result, user, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = {
                            code: req.query.code,
                        };
                        if (!this.oauth2) return [3 /*break*/, 5];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.oauth2.authorizationCode.getToken(options)];
                    case 2:
                        result = _a.sent();
                        return [4 /*yield*/, this.grabUserInfo(result.access_token)];
                    case 3:
                        user = _a.sent();
                        if (req.session) {
                            req.session.user = user;
                            req.session.authorized = true;
                        }
                        return [2 /*return*/, res.redirect("/")];
                    case 4:
                        error_1 = _a.sent();
                        log.httpError(req, error_1);
                        return [2 /*return*/, res.json("Authentication failed")];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    SSOClient.prototype.grabUserInfo = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenHost, options;
            return __generator(this, function (_a) {
                tokenHost = this.ssoPaths.tokenHost;
                options = {
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                };
                return [2 /*return*/, node_fetch_1.default(tokenHost + this.userInfoPath, options)];
            });
        });
    };
    return SSOClient;
}());
exports.default = SSOClient;
