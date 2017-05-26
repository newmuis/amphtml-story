/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/** @fileoverview @suppress {checkTypes, suspiciousCode, uselessCode} */

import * as ast from './css-expr-ast';

/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,7],$V1=[1,8],$V2=[1,9],$V3=[1,14],$V4=[1,15],$V5=[1,22],$V6=[1,23],$V7=[1,24],$V8=[1,25],$V9=[1,26],$Va=[1,27],$Vb=[1,28],$Vc=[1,29],$Vd=[1,30],$Ve=[1,31],$Vf=[1,32],$Vg=[1,33],$Vh=[1,34],$Vi=[1,35],$Vj=[1,36],$Vk=[1,37],$Vl=[1,38],$Vm=[1,39],$Vn=[1,51],$Vo=[1,40],$Vp=[1,43],$Vq=[1,44],$Vr=[1,45],$Vs=[1,46],$Vt=[1,47],$Vu=[1,48],$Vv=[1,49],$Vw=[1,50],$Vx=[1,41],$Vy=[1,42],$Vz=[5,9,10,11,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,42,46,47,48,49,50,51,52,53,55,56,58],$VA=[5,9,10,11,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,42,43,45,46,47,48,49,50,51,52,53,55,56,58,61,62,63,64],$VB=[1,58],$VC=[1,79],$VD=[1,80],$VE=[1,81],$VF=[1,82],$VG=[43,61,62,63,64],$VH=[1,85],$VI=[43,45],$VJ=[43,63,64];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"result":3,"value":4,"EOF":5,"literal_or_function":6,"literal":7,"function":8,"STRING":9,"NUMBER":10,"PERCENTAGE":11,"length":12,"angle":13,"time":14,"url":15,"HEXCOLOR":16,"IDENT":17,"LENGTH_PX":18,"LENGTH_EM":19,"LENGTH_REM":20,"LENGTH_VH":21,"LENGTH_VW":22,"LENGTH_VMIN":23,"LENGTH_VMAX":24,"LENGTH_CM":25,"LENGTH_MM":26,"LENGTH_Q":27,"LENGTH_IN":28,"LENGTH_PC":29,"LENGTH_PT":30,"ANGLE_DEG":31,"ANGLE_RAD":32,"ANGLE_GRAD":33,"TIME_MS":34,"TIME_S":35,"var_function":36,"calc_function":37,"translate_function":38,"dim_function":39,"rand_function":40,"any_function":41,"FUNCTION_START":42,")":43,"args":44,",":45,"URL_START":46,"TRANSLATE_START":47,"TRANSLATE_X_START":48,"TRANSLATE_Y_START":49,"TRANSLATE_Z_START":50,"TRANSLATE_3D_START":51,"WIDTH_START":52,"HEIGHT_START":53,"CLOSEST_START":54,"RAND_START":55,"VAR_START":56,"VAR_NAME":57,"CALC_START":58,"calc_expr":59,"(":60,"*":61,"/":62,"+":63,"-":64,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",9:"STRING",10:"NUMBER",11:"PERCENTAGE",16:"HEXCOLOR",17:"IDENT",18:"LENGTH_PX",19:"LENGTH_EM",20:"LENGTH_REM",21:"LENGTH_VH",22:"LENGTH_VW",23:"LENGTH_VMIN",24:"LENGTH_VMAX",25:"LENGTH_CM",26:"LENGTH_MM",27:"LENGTH_Q",28:"LENGTH_IN",29:"LENGTH_PC",30:"LENGTH_PT",31:"ANGLE_DEG",32:"ANGLE_RAD",33:"ANGLE_GRAD",34:"TIME_MS",35:"TIME_S",42:"FUNCTION_START",43:")",45:",",46:"URL_START",47:"TRANSLATE_START",48:"TRANSLATE_X_START",49:"TRANSLATE_Y_START",50:"TRANSLATE_Z_START",51:"TRANSLATE_3D_START",52:"WIDTH_START",53:"HEIGHT_START",54:"CLOSEST_START",55:"RAND_START",56:"VAR_START",57:"VAR_NAME",58:"CALC_START",60:"(",61:"*",62:"/",63:"+",64:"-"},
productions_: [0,[3,2],[3,1],[4,1],[4,2],[6,1],[6,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[12,1],[12,1],[12,1],[12,1],[12,1],[12,1],[12,1],[12,1],[12,1],[12,1],[12,1],[12,1],[12,1],[13,1],[13,1],[13,1],[14,1],[14,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[41,2],[41,3],[44,1],[44,3],[15,3],[38,3],[38,3],[38,3],[38,3],[38,3],[39,2],[39,2],[39,3],[39,3],[39,5],[39,5],[40,2],[40,5],[36,3],[36,5],[37,3],[59,1],[59,3],[59,3],[59,3],[59,3],[59,3]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
return $$[$0-1];
break;
case 2:
return null;
break;
case 3: case 5: case 6: case 10: case 11: case 12: case 13: case 34: case 35: case 36: case 37: case 38: case 39: case 61:
this.$ = $$[$0];
break;
case 4:
this.$ = ast.CssConcatNode.concat($$[$0-1], $$[$0]);
break;
case 7: case 14: case 15:
this.$ = new ast.CssPassthroughNode($$[$0]);
break;
case 8:
this.$ = new ast.CssNumberNode(parseFloat($$[$0]));
break;
case 9:
this.$ = new ast.CssPercentNode(parseFloat($$[$0]));
break;
case 16:
this.$ = new ast.CssLengthNode(parseFloat($$[$0]), 'px');
break;
case 17:
this.$ = new ast.CssLengthNode(parseFloat($$[$0]), 'em');
break;
case 18:
this.$ = new ast.CssLengthNode(parseFloat($$[$0]), 'rem');
break;
case 19:
this.$ = new ast.CssLengthNode(parseFloat($$[$0]), 'vh');
break;
case 20:
this.$ = new ast.CssLengthNode(parseFloat($$[$0]), 'vw');
break;
case 21:
this.$ = new ast.CssLengthNode(parseFloat($$[$0]), 'vmin');
break;
case 22:
this.$ = new ast.CssLengthNode(parseFloat($$[$0]), 'vmax');
break;
case 23:
this.$ = new ast.CssLengthNode(parseFloat($$[$0]), 'cm');
break;
case 24:
this.$ = new ast.CssLengthNode(parseFloat($$[$0]), 'mm');
break;
case 25:
this.$ = new ast.CssLengthNode(parseFloat($$[$0]), 'q');
break;
case 26:
this.$ = new ast.CssLengthNode(parseFloat($$[$0]), 'in');
break;
case 27:
this.$ = new ast.CssLengthNode(parseFloat($$[$0]), 'pc');
break;
case 28:
this.$ = new ast.CssLengthNode(parseFloat($$[$0]), 'pt');
break;
case 29:
this.$ = new ast.CssAngleNode(parseFloat($$[$0]), 'deg');
break;
case 30:
this.$ = new ast.CssAngleNode(parseFloat($$[$0]), 'rad');
break;
case 31:
this.$ = new ast.CssAngleNode(parseFloat($$[$0]), 'grad');
break;
case 32:
this.$ = new ast.CssTimeNode(parseFloat($$[$0]), 'ms');
break;
case 33:
this.$ = new ast.CssTimeNode(parseFloat($$[$0]), 's');
break;
case 40:
this.$ = new ast.CssFuncNode($$[$0-1].slice(0, -1), []);
break;
case 41:
this.$ = new ast.CssFuncNode($$[$0-2].slice(0, -1), $$[$0-1]);
break;
case 42:
this.$ = [$$[$0]];
break;
case 43:

        const args = $$[$0-2];
        args.push($$[$0]);
        this.$ = args;
      
break;
case 44:
this.$ = new ast.CssUrlNode($$[$0-1].slice(1, -1));
break;
case 45:
this.$ = new ast.CssTranslateNode('', $$[$0-1]);
break;
case 46:
this.$ = new ast.CssTranslateNode('x', $$[$0-1]);
break;
case 47:
this.$ = new ast.CssTranslateNode('y', $$[$0-1]);
break;
case 48:
this.$ = new ast.CssTranslateNode('z', $$[$0-1]);
break;
case 49:
this.$ = new ast.CssTranslateNode('3d', $$[$0-1]);
break;
case 50:
this.$ = new ast.CssDimSizeNode('w');
break;
case 51:
this.$ = new ast.CssDimSizeNode('h');
break;
case 52:
this.$ = new ast.CssDimSizeNode('w', $$[$0-1].slice(1, -1));
break;
case 53:
this.$ = new ast.CssDimSizeNode('h', $$[$0-1].slice(1, -1));
break;
case 54:
this.$ = new ast.CssDimSizeNode('w', $$[$0-2].slice(1, -1), 'closest');
break;
case 55:
this.$ = new ast.CssDimSizeNode('h', $$[$0-2].slice(1, -1), 'closest');
break;
case 56:
this.$ = new ast.CssRandNode();
break;
case 57:
this.$ = new ast.CssRandNode($$[$0-3], $$[$0-1]);
break;
case 58:
this.$ = new ast.CssVarNode($$[$0-1]);
break;
case 59:
this.$ = new ast.CssVarNode($$[$0-3], $$[$0-1]);
break;
case 60:
this.$ = new ast.CssCalcNode($$[$0-1]);
break;
case 62:
this.$ = $$[$0-1];
break;
case 63:
this.$ = new ast.CssCalcProductNode($$[$0-2], $$[$0], '*');
break;
case 64:
this.$ = new ast.CssCalcProductNode($$[$0-2], $$[$0], '/');
break;
case 65:
this.$ = new ast.CssCalcSumNode($$[$0-2], $$[$0], '+');
break;
case 66:
this.$ = new ast.CssCalcSumNode($$[$0-2], $$[$0], '-');
break;
}
},
table: [{3:1,4:2,5:[1,3],6:4,7:5,8:6,9:$V0,10:$V1,11:$V2,12:10,13:11,14:12,15:13,16:$V3,17:$V4,18:$V5,19:$V6,20:$V7,21:$V8,22:$V9,23:$Va,24:$Vb,25:$Vc,26:$Vd,27:$Ve,28:$Vf,29:$Vg,30:$Vh,31:$Vi,32:$Vj,33:$Vk,34:$Vl,35:$Vm,36:16,37:17,38:18,39:19,40:20,41:21,42:$Vn,46:$Vo,47:$Vp,48:$Vq,49:$Vr,50:$Vs,51:$Vt,52:$Vu,53:$Vv,55:$Vw,56:$Vx,58:$Vy},{1:[3]},{5:[1,52],6:53,7:5,8:6,9:$V0,10:$V1,11:$V2,12:10,13:11,14:12,15:13,16:$V3,17:$V4,18:$V5,19:$V6,20:$V7,21:$V8,22:$V9,23:$Va,24:$Vb,25:$Vc,26:$Vd,27:$Ve,28:$Vf,29:$Vg,30:$Vh,31:$Vi,32:$Vj,33:$Vk,34:$Vl,35:$Vm,36:16,37:17,38:18,39:19,40:20,41:21,42:$Vn,46:$Vo,47:$Vp,48:$Vq,49:$Vr,50:$Vs,51:$Vt,52:$Vu,53:$Vv,55:$Vw,56:$Vx,58:$Vy},{1:[2,2]},o($Vz,[2,3]),o($VA,[2,5]),o($VA,[2,6]),o($VA,[2,7]),o($VA,[2,8]),o($VA,[2,9]),o($VA,[2,10]),o($VA,[2,11]),o($VA,[2,12]),o($VA,[2,13]),o($VA,[2,14]),o($VA,[2,15]),o($VA,[2,34]),o($VA,[2,35]),o($VA,[2,36]),o($VA,[2,37]),o($VA,[2,38]),o($VA,[2,39]),o($VA,[2,16]),o($VA,[2,17]),o($VA,[2,18]),o($VA,[2,19]),o($VA,[2,20]),o($VA,[2,21]),o($VA,[2,22]),o($VA,[2,23]),o($VA,[2,24]),o($VA,[2,25]),o($VA,[2,26]),o($VA,[2,27]),o($VA,[2,28]),o($VA,[2,29]),o($VA,[2,30]),o($VA,[2,31]),o($VA,[2,32]),o($VA,[2,33]),{9:[1,54]},{57:[1,55]},{6:57,7:5,8:6,9:$V0,10:$V1,11:$V2,12:10,13:11,14:12,15:13,16:$V3,17:$V4,18:$V5,19:$V6,20:$V7,21:$V8,22:$V9,23:$Va,24:$Vb,25:$Vc,26:$Vd,27:$Ve,28:$Vf,29:$Vg,30:$Vh,31:$Vi,32:$Vj,33:$Vk,34:$Vl,35:$Vm,36:16,37:17,38:18,39:19,40:20,41:21,42:$Vn,46:$Vo,47:$Vp,48:$Vq,49:$Vr,50:$Vs,51:$Vt,52:$Vu,53:$Vv,55:$Vw,56:$Vx,58:$Vy,59:56,60:$VB},{6:60,7:5,8:6,9:$V0,10:$V1,11:$V2,12:10,13:11,14:12,15:13,16:$V3,17:$V4,18:$V5,19:$V6,20:$V7,21:$V8,22:$V9,23:$Va,24:$Vb,25:$Vc,26:$Vd,27:$Ve,28:$Vf,29:$Vg,30:$Vh,31:$Vi,32:$Vj,33:$Vk,34:$Vl,35:$Vm,36:16,37:17,38:18,39:19,40:20,41:21,42:$Vn,44:59,46:$Vo,47:$Vp,48:$Vq,49:$Vr,50:$Vs,51:$Vt,52:$Vu,53:$Vv,55:$Vw,56:$Vx,58:$Vy},{6:60,7:5,8:6,9:$V0,10:$V1,11:$V2,12:10,13:11,14:12,15:13,16:$V3,17:$V4,18:$V5,19:$V6,20:$V7,21:$V8,22:$V9,23:$Va,24:$Vb,25:$Vc,26:$Vd,27:$Ve,28:$Vf,29:$Vg,30:$Vh,31:$Vi,32:$Vj,33:$Vk,34:$Vl,35:$Vm,36:16,37:17,38:18,39:19,40:20,41:21,42:$Vn,44:61,46:$Vo,47:$Vp,48:$Vq,49:$Vr,50:$Vs,51:$Vt,52:$Vu,53:$Vv,55:$Vw,56:$Vx,58:$Vy},{6:60,7:5,8:6,9:$V0,10:$V1,11:$V2,12:10,13:11,14:12,15:13,16:$V3,17:$V4,18:$V5,19:$V6,20:$V7,21:$V8,22:$V9,23:$Va,24:$Vb,25:$Vc,26:$Vd,27:$Ve,28:$Vf,29:$Vg,30:$Vh,31:$Vi,32:$Vj,33:$Vk,34:$Vl,35:$Vm,36:16,37:17,38:18,39:19,40:20,41:21,42:$Vn,44:62,46:$Vo,47:$Vp,48:$Vq,49:$Vr,50:$Vs,51:$Vt,52:$Vu,53:$Vv,55:$Vw,56:$Vx,58:$Vy},{6:60,7:5,8:6,9:$V0,10:$V1,11:$V2,12:10,13:11,14:12,15:13,16:$V3,17:$V4,18:$V5,19:$V6,20:$V7,21:$V8,22:$V9,23:$Va,24:$Vb,25:$Vc,26:$Vd,27:$Ve,28:$Vf,29:$Vg,30:$Vh,31:$Vi,32:$Vj,33:$Vk,34:$Vl,35:$Vm,36:16,37:17,38:18,39:19,40:20,41:21,42:$Vn,44:63,46:$Vo,47:$Vp,48:$Vq,49:$Vr,50:$Vs,51:$Vt,52:$Vu,53:$Vv,55:$Vw,56:$Vx,58:$Vy},{6:60,7:5,8:6,9:$V0,10:$V1,11:$V2,12:10,13:11,14:12,15:13,16:$V3,17:$V4,18:$V5,19:$V6,20:$V7,21:$V8,22:$V9,23:$Va,24:$Vb,25:$Vc,26:$Vd,27:$Ve,28:$Vf,29:$Vg,30:$Vh,31:$Vi,32:$Vj,33:$Vk,34:$Vl,35:$Vm,36:16,37:17,38:18,39:19,40:20,41:21,42:$Vn,44:64,46:$Vo,47:$Vp,48:$Vq,49:$Vr,50:$Vs,51:$Vt,52:$Vu,53:$Vv,55:$Vw,56:$Vx,58:$Vy},{9:[1,66],43:[1,65],54:[1,67]},{9:[1,69],43:[1,68],54:[1,70]},{6:72,7:5,8:6,9:$V0,10:$V1,11:$V2,12:10,13:11,14:12,15:13,16:$V3,17:$V4,18:$V5,19:$V6,20:$V7,21:$V8,22:$V9,23:$Va,24:$Vb,25:$Vc,26:$Vd,27:$Ve,28:$Vf,29:$Vg,30:$Vh,31:$Vi,32:$Vj,33:$Vk,34:$Vl,35:$Vm,36:16,37:17,38:18,39:19,40:20,41:21,42:$Vn,43:[1,71],46:$Vo,47:$Vp,48:$Vq,49:$Vr,50:$Vs,51:$Vt,52:$Vu,53:$Vv,55:$Vw,56:$Vx,58:$Vy},{6:60,7:5,8:6,9:$V0,10:$V1,11:$V2,12:10,13:11,14:12,15:13,16:$V3,17:$V4,18:$V5,19:$V6,20:$V7,21:$V8,22:$V9,23:$Va,24:$Vb,25:$Vc,26:$Vd,27:$Ve,28:$Vf,29:$Vg,30:$Vh,31:$Vi,32:$Vj,33:$Vk,34:$Vl,35:$Vm,36:16,37:17,38:18,39:19,40:20,41:21,42:$Vn,43:[1,73],44:74,46:$Vo,47:$Vp,48:$Vq,49:$Vr,50:$Vs,51:$Vt,52:$Vu,53:$Vv,55:$Vw,56:$Vx,58:$Vy},{1:[2,1]},o($Vz,[2,4]),{43:[1,75]},{43:[1,76],45:[1,77]},{43:[1,78],61:$VC,62:$VD,63:$VE,64:$VF},o($VG,[2,61]),{6:57,7:5,8:6,9:$V0,10:$V1,11:$V2,12:10,13:11,14:12,15:13,16:$V3,17:$V4,18:$V5,19:$V6,20:$V7,21:$V8,22:$V9,23:$Va,24:$Vb,25:$Vc,26:$Vd,27:$Ve,28:$Vf,29:$Vg,30:$Vh,31:$Vi,32:$Vj,33:$Vk,34:$Vl,35:$Vm,36:16,37:17,38:18,39:19,40:20,41:21,42:$Vn,46:$Vo,47:$Vp,48:$Vq,49:$Vr,50:$Vs,51:$Vt,52:$Vu,53:$Vv,55:$Vw,56:$Vx,58:$Vy,59:83,60:$VB},{43:[1,84],45:$VH},o($VI,[2,42]),{43:[1,86],45:$VH},{43:[1,87],45:$VH},{43:[1,88],45:$VH},{43:[1,89],45:$VH},o($VA,[2,50]),{43:[1,90]},{9:[1,91]},o($VA,[2,51]),{43:[1,92]},{9:[1,93]},o($VA,[2,56]),{45:[1,94]},o($VA,[2,40]),{43:[1,95],45:$VH},o($VA,[2,44]),o($VA,[2,58]),{6:96,7:5,8:6,9:$V0,10:$V1,11:$V2,12:10,13:11,14:12,15:13,16:$V3,17:$V4,18:$V5,19:$V6,20:$V7,21:$V8,22:$V9,23:$Va,24:$Vb,25:$Vc,26:$Vd,27:$Ve,28:$Vf,29:$Vg,30:$Vh,31:$Vi,32:$Vj,33:$Vk,34:$Vl,35:$Vm,36:16,37:17,38:18,39:19,40:20,41:21,42:$Vn,46:$Vo,47:$Vp,48:$Vq,49:$Vr,50:$Vs,51:$Vt,52:$Vu,53:$Vv,55:$Vw,56:$Vx,58:$Vy},o($VA,[2,60]),{6:57,7:5,8:6,9:$V0,10:$V1,11:$V2,12:10,13:11,14:12,15:13,16:$V3,17:$V4,18:$V5,19:$V6,20:$V7,21:$V8,22:$V9,23:$Va,24:$Vb,25:$Vc,26:$Vd,27:$Ve,28:$Vf,29:$Vg,30:$Vh,31:$Vi,32:$Vj,33:$Vk,34:$Vl,35:$Vm,36:16,37:17,38:18,39:19,40:20,41:21,42:$Vn,46:$Vo,47:$Vp,48:$Vq,49:$Vr,50:$Vs,51:$Vt,52:$Vu,53:$Vv,55:$Vw,56:$Vx,58:$Vy,59:97,60:$VB},{6:57,7:5,8:6,9:$V0,10:$V1,11:$V2,12:10,13:11,14:12,15:13,16:$V3,17:$V4,18:$V5,19:$V6,20:$V7,21:$V8,22:$V9,23:$Va,24:$Vb,25:$Vc,26:$Vd,27:$Ve,28:$Vf,29:$Vg,30:$Vh,31:$Vi,32:$Vj,33:$Vk,34:$Vl,35:$Vm,36:16,37:17,38:18,39:19,40:20,41:21,42:$Vn,46:$Vo,47:$Vp,48:$Vq,49:$Vr,50:$Vs,51:$Vt,52:$Vu,53:$Vv,55:$Vw,56:$Vx,58:$Vy,59:98,60:$VB},{6:57,7:5,8:6,9:$V0,10:$V1,11:$V2,12:10,13:11,14:12,15:13,16:$V3,17:$V4,18:$V5,19:$V6,20:$V7,21:$V8,22:$V9,23:$Va,24:$Vb,25:$Vc,26:$Vd,27:$Ve,28:$Vf,29:$Vg,30:$Vh,31:$Vi,32:$Vj,33:$Vk,34:$Vl,35:$Vm,36:16,37:17,38:18,39:19,40:20,41:21,42:$Vn,46:$Vo,47:$Vp,48:$Vq,49:$Vr,50:$Vs,51:$Vt,52:$Vu,53:$Vv,55:$Vw,56:$Vx,58:$Vy,59:99,60:$VB},{6:57,7:5,8:6,9:$V0,10:$V1,11:$V2,12:10,13:11,14:12,15:13,16:$V3,17:$V4,18:$V5,19:$V6,20:$V7,21:$V8,22:$V9,23:$Va,24:$Vb,25:$Vc,26:$Vd,27:$Ve,28:$Vf,29:$Vg,30:$Vh,31:$Vi,32:$Vj,33:$Vk,34:$Vl,35:$Vm,36:16,37:17,38:18,39:19,40:20,41:21,42:$Vn,46:$Vo,47:$Vp,48:$Vq,49:$Vr,50:$Vs,51:$Vt,52:$Vu,53:$Vv,55:$Vw,56:$Vx,58:$Vy,59:100,60:$VB},{43:[1,101],61:$VC,62:$VD,63:$VE,64:$VF},o($VA,[2,45]),{6:102,7:5,8:6,9:$V0,10:$V1,11:$V2,12:10,13:11,14:12,15:13,16:$V3,17:$V4,18:$V5,19:$V6,20:$V7,21:$V8,22:$V9,23:$Va,24:$Vb,25:$Vc,26:$Vd,27:$Ve,28:$Vf,29:$Vg,30:$Vh,31:$Vi,32:$Vj,33:$Vk,34:$Vl,35:$Vm,36:16,37:17,38:18,39:19,40:20,41:21,42:$Vn,46:$Vo,47:$Vp,48:$Vq,49:$Vr,50:$Vs,51:$Vt,52:$Vu,53:$Vv,55:$Vw,56:$Vx,58:$Vy},o($VA,[2,46]),o($VA,[2,47]),o($VA,[2,48]),o($VA,[2,49]),o($VA,[2,52]),{43:[1,103]},o($VA,[2,53]),{43:[1,104]},{6:105,7:5,8:6,9:$V0,10:$V1,11:$V2,12:10,13:11,14:12,15:13,16:$V3,17:$V4,18:$V5,19:$V6,20:$V7,21:$V8,22:$V9,23:$Va,24:$Vb,25:$Vc,26:$Vd,27:$Ve,28:$Vf,29:$Vg,30:$Vh,31:$Vi,32:$Vj,33:$Vk,34:$Vl,35:$Vm,36:16,37:17,38:18,39:19,40:20,41:21,42:$Vn,46:$Vo,47:$Vp,48:$Vq,49:$Vr,50:$Vs,51:$Vt,52:$Vu,53:$Vv,55:$Vw,56:$Vx,58:$Vy},o($VA,[2,41]),{43:[1,106]},o($VG,[2,63]),o($VG,[2,64]),o($VJ,[2,65],{61:$VC,62:$VD}),o($VJ,[2,66],{61:$VC,62:$VD}),o($VG,[2,62]),o($VI,[2,43]),{43:[1,107]},{43:[1,108]},{43:[1,109]},o($VA,[2,59]),o($VA,[2,54]),o($VA,[2,55]),o($VA,[2,57])],
defaultActions: {3:[2,2],52:[2,1]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        var lex = function () {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        };
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:return 18
break;
case 2:return 19
break;
case 3:return 20
break;
case 4:return 21
break;
case 5:return 22
break;
case 6:return 23
break;
case 7:return 24
break;
case 8:return 25
break;
case 9:return 26
break;
case 10:return 27
break;
case 11:return 28
break;
case 12:return 29
break;
case 13:return 30
break;
case 14:return 31
break;
case 15:return 32
break;
case 16:return 33
break;
case 17:return 34
break;
case 18:return 35
break;
case 19:return 11
break;
case 20:return 10
break;
case 21:return 16;
break;
case 22:return 46
break;
case 23:return 58
break;
case 24:return 56
break;
case 25:return 47
break;
case 26:return 48
break;
case 27:return 49
break;
case 28:return 50
break;
case 29:return 51
break;
case 30:return 55
break;
case 31:return 52
break;
case 32:return 53
break;
case 33:return 54
break;
case 34:return 42
break;
case 35:return 17
break;
case 36:return 57;
break;
case 37:return 9
break;
case 38:return 63
break;
case 39:return 64
break;
case 40:return 61
break;
case 41:return 62
break;
case 42:return 60
break;
case 43:return 43
break;
case 44:return 45
break;
case 45:return 'INVALID'
break;
case 46:return 5
break;
}
},
rules: [/^(?:\s+)/,/^(?:([+-]?[0-9]+(\.[0-9]+)?([eE][+\-]?[0-9]+)?|[+-]?\.[0-9]+([eE][+\-]?[0-9]+)?)([Pp])([Xx]))/,/^(?:([+-]?[0-9]+(\.[0-9]+)?([eE][+\-]?[0-9]+)?|[+-]?\.[0-9]+([eE][+\-]?[0-9]+)?)([Ee])([Mm]))/,/^(?:([+-]?[0-9]+(\.[0-9]+)?([eE][+\-]?[0-9]+)?|[+-]?\.[0-9]+([eE][+\-]?[0-9]+)?)([Rr])([Ee])([Mm]))/,/^(?:([+-]?[0-9]+(\.[0-9]+)?([eE][+\-]?[0-9]+)?|[+-]?\.[0-9]+([eE][+\-]?[0-9]+)?)([Vv])([Hh]))/,/^(?:([+-]?[0-9]+(\.[0-9]+)?([eE][+\-]?[0-9]+)?|[+-]?\.[0-9]+([eE][+\-]?[0-9]+)?)([Vv])([Ww]))/,/^(?:([+-]?[0-9]+(\.[0-9]+)?([eE][+\-]?[0-9]+)?|[+-]?\.[0-9]+([eE][+\-]?[0-9]+)?)([Vv])([Mm])([Ii])([Nn]))/,/^(?:([+-]?[0-9]+(\.[0-9]+)?([eE][+\-]?[0-9]+)?|[+-]?\.[0-9]+([eE][+\-]?[0-9]+)?)([Vv])([Mm])([Aa])([Xx]))/,/^(?:([+-]?[0-9]+(\.[0-9]+)?([eE][+\-]?[0-9]+)?|[+-]?\.[0-9]+([eE][+\-]?[0-9]+)?)([Cc])([Mm]))/,/^(?:([+-]?[0-9]+(\.[0-9]+)?([eE][+\-]?[0-9]+)?|[+-]?\.[0-9]+([eE][+\-]?[0-9]+)?)([Mm])([Mm]))/,/^(?:([+-]?[0-9]+(\.[0-9]+)?([eE][+\-]?[0-9]+)?|[+-]?\.[0-9]+([eE][+\-]?[0-9]+)?)([Qq]))/,/^(?:([+-]?[0-9]+(\.[0-9]+)?([eE][+\-]?[0-9]+)?|[+-]?\.[0-9]+([eE][+\-]?[0-9]+)?)([Ii])([Nn]))/,/^(?:([+-]?[0-9]+(\.[0-9]+)?([eE][+\-]?[0-9]+)?|[+-]?\.[0-9]+([eE][+\-]?[0-9]+)?)([Pp])([Cc]))/,/^(?:([+-]?[0-9]+(\.[0-9]+)?([eE][+\-]?[0-9]+)?|[+-]?\.[0-9]+([eE][+\-]?[0-9]+)?)([Pp])([Tt]))/,/^(?:([+-]?[0-9]+(\.[0-9]+)?([eE][+\-]?[0-9]+)?|[+-]?\.[0-9]+([eE][+\-]?[0-9]+)?)([Dd])([Ee])([Gg]))/,/^(?:([+-]?[0-9]+(\.[0-9]+)?([eE][+\-]?[0-9]+)?|[+-]?\.[0-9]+([eE][+\-]?[0-9]+)?)([Rr])([Aa])([Dd]))/,/^(?:([+-]?[0-9]+(\.[0-9]+)?([eE][+\-]?[0-9]+)?|[+-]?\.[0-9]+([eE][+\-]?[0-9]+)?)([Gg])([Rr])([Aa])([Dd]))/,/^(?:([+-]?[0-9]+(\.[0-9]+)?([eE][+\-]?[0-9]+)?|[+-]?\.[0-9]+([eE][+\-]?[0-9]+)?)([Mm])([Ss]))/,/^(?:([+-]?[0-9]+(\.[0-9]+)?([eE][+\-]?[0-9]+)?|[+-]?\.[0-9]+([eE][+\-]?[0-9]+)?)([Ss]))/,/^(?:([+-]?[0-9]+(\.[0-9]+)?([eE][+\-]?[0-9]+)?|[+-]?\.[0-9]+([eE][+\-]?[0-9]+)?)%)/,/^(?:([+-]?[0-9]+(\.[0-9]+)?([eE][+\-]?[0-9]+)?|[+-]?\.[0-9]+([eE][+\-]?[0-9]+)?)\b)/,/^(?:#([a-fA-F0-9]+))/,/^(?:([Uu])([Rr])([Ll])\()/,/^(?:([Cc])([Aa])([Ll])([Cc])\()/,/^(?:([Vv])([Aa])([Rr])\()/,/^(?:([Tt])([Rr])([Aa])([Nn])([Ss])([Ll])([Aa])([Tt])([Ee])\()/,/^(?:([Tt])([Rr])([Aa])([Nn])([Ss])([Ll])([Aa])([Tt])([Ee])([Xx])\()/,/^(?:([Tt])([Rr])([Aa])([Nn])([Ss])([Ll])([Aa])([Tt])([Ee])([Yy])\()/,/^(?:([Tt])([Rr])([Aa])([Nn])([Ss])([Ll])([Aa])([Tt])([Ee])([Zz])\()/,/^(?:([Tt])([Rr])([Aa])([Nn])([Ss])([Ll])([Aa])([Tt])([Ee])3([Dd])\()/,/^(?:([Rr])([Aa])([Nn])([Dd])\()/,/^(?:([Ww])([Ii])([Dd])([Tt])([Hh])\()/,/^(?:([Hh])([Ee])([Ii])([Gg])([Hh])([Tt])\()/,/^(?:([Cc])([Ll])([Oo])([Ss])([Ee])([Ss])([Tt])\()/,/^(?:(-?[a-zA-Z_][\-a-zA-Z0-9_]*)\()/,/^(?:(-?[a-zA-Z_][\-a-zA-Z0-9_]*))/,/^(?:--(-?[a-zA-Z_][\-a-zA-Z0-9_]*))/,/^(?:('[^\']*'|"[^\"]*"))/,/^(?:\+)/,/^(?:-)/,/^(?:\*)/,/^(?:\/)/,/^(?:\()/,/^(?:\))/,/^(?:,)/,/^(?:.)/,/^(?:$)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();

exports.parser = parser;
