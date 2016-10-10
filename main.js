/***************************************/
/*******  这算是一个外挂工具    ********/
/****  用以满足在直播画面上打标记   ****/
/***************************************/
(function(window,location){
    /* 新建一个标记容器到 containerSelector 中 */
    function MarkBox(containerSelector,opts){
        this._init(containerSelector,opts);
    };

    $.extend(MarkBox.prototype,{
        /* 初始化基础参数 */
        _init: function(sel, opts){
            var _t = this, r;
            opts = _t._opts = opts||{};
            opts.width = opts.width||856;
            opts.height = opts.height||482;
            opts._v = opts.width/opts.height;

            /* 创建容器 */
            _t.$wrap = $(sel).append(
                _t.$box = $('<div class="marks-box"></div>')
            );

            /* 校正位置 */
            (r = function(){
                _t.resize();
            })();

            /* 默认跟随窗口大小变化自适应 */
            if(!_t._opts.noResize){
                $(window).on("load resize",r);
            }

            /* 根据地址栏参数判断启动编辑模式 */
            _t._btns = '';
            (_t._edit = opts.edit) && _t._initEditor();
        },

        /* 启动编辑器 */
        _initEditor:function(){
            var _t = this, opts = _t._opts;

            /* 增加全局新建按钮 */
            $(
                '<div class="m-btns">'+
                    '<a href="###" class="m-add-p">新建点形标记</a>'+
                    '<a href="###" class="m-add-a">新建箭头标记</a>'+
                    '<a href="###" class="m-get-url" title="得到带有标记信息的访问地址">得到分享地址</a>'+
                '</div>'
            ).appendTo(_t.$box);

            /* 每个标记增加操作按钮 */
            _t._btns = ''+
                '<div class="m-btns">'+
                    '<a href="###" class="m-move" title="拖拽移动标记所在位置">移动</a>'+
                    '<a href="###" class="m-rota" title="左右拖拽以调整角度">旋转</a>'+
                    '<a href="###" class="m-recl" title="更换标记颜色">换色</a>'+
                    '<a href="###" class="m-renm" title="更换标记文案">改名</a>'+
                    '<a href="###" class="m-del" title="从界面中移除当前标记">删除</a>'+
                    (opts.afterBtnsHTML||'')+
                '</div>';


            /* 各种编辑操作 */
            var _$currMark, _currAct, 
                _sta_pos, 
                _box_w_percent, _box_h_percent, 
                _sta_pageX, _sta_pageY, 
                _top_diff, _left_diff,
                _sta_totate,
                mousemoveFuns = _t.mousemoveFuns = {
                    '移动':function(e, $mark){
                        var top = +((e.pageY + _top_diff)/_box_h_percent).toFixed(3),
                            left = +((e.pageX +_left_diff)/_box_w_percent).toFixed(3);
                        $mark.css({
                            top: top+'%',
                            left: left+'%'
                        }).data({
                            'top': top,
                            'left': left
                        });
                    },
                    '旋转':function(e, $mark){
                        _t.setArrowDeg($mark, _sta_totate +e.pageX-_sta_pageX);
                    }
                },
                clickFuns = _t.clickFuns = {
                    '删除':function(e, $mark){
                        $mark.remove();
                    },
                    '改名':function(e, $mark){
                        var newName = window.prompt('请输入新的标记名称：',$mark.data('txt'));
                        newName && $mark.attr('data-txt',newName).data('txt',newName).find('span').text(newName);
                    },
                    '换色':function(e, $mark){
                        var color = window.prompt('请输入新的色值代码(例:red/blue/green/#000/#fff/...)：',$mark.data('color'));
                        color && $mark.data('color',color).css('backgroundColor', color);
                    },
                    '新建点形标记':function(e){
                        var newName = window.prompt('请输入标记名称：','');
                        newName && _t.addPoint(newName);
                    },
                    '新建箭头标记':function(e){
                        var newName = window.prompt('请输入标记名称：','');
                        newName && _t.addArrow(newName);
                    },
                    '得到分享地址':function(e){
                        window.prompt('访问以下地址看带有标记的直播：',_t.getShareUrl());
                    }
                };

            /* 支持参数传递自定义处理逻辑 */
            opts.mousemoveFuns && $.extend(mousemoveFuns,opts.mousemoveFuns);
            opts.clickFuns && $.extend(clickFuns,opts.clickFuns);

            $(document).on("click", ".m-btns a", function(e){
                var $btn = $(this), act = $btn.text();
                clickFuns[act] && clickFuns[act](e, $btn.closest("i"));
                return false;
            }).on("mousedown", ".m-move,.m-rota", function(e){
                /* 通过鼠标拖拽实现 移动||旋转 */
                var $btn = $(this), $box = _t.$box;
                _$currMark = $btn.closest("i");
                _sta_pos = _$currMark.position();

                _sta_pageY = e.pageY;
                _sta_pageX = e.pageX;
                _top_diff = _sta_pos.top-_sta_pageY;
                _left_diff = _sta_pos.left-_sta_pageX;

                _box_w_percent = $box.width()/100;
                _box_h_percent = $box.height()/100;

                _currAct = $btn.text();

                _sta_totate = parseFloat(_$currMark.data('rotate'))||0;

                e.preventDefault();
            }).on("mousemove", function(e){
                _currAct && mousemoveFuns[_currAct] && mousemoveFuns[_currAct](e, _$currMark);
                e.preventDefault();
            }).on("mouseup", function(e){
                _currAct =null;

                e.preventDefault();
            });


        },

        /* 根据缩放重置标记容器尺寸坐标 */
        resize: function(){
            var _t = this, 
                w= _t.$wrap.width(), 
                h = _t.$wrap.height(), 
                _v = _t._opts._v, 
                lr = Math.max(0,(w-(h*_v))/2), 
                tb = Math.max(0,(h-(w/_v))/2);
            _t.$box.css({
                top:tb,
                bottom:tb,
                left:lr,
                right:lr
            });
        },

        /* 创建一个点形标记 */
        addPoint: function(txt, left, top, color){
            var _t = this, css = {};
            if(top!=undefined)css.top=top+'%';
            if(left!=undefined)css.left=left+'%';
            if(color!=undefined)css.backgroundColor=color;
            return $('<i class="point">'+_t._btns+'</i>').data({
                'type':'p',
                'txt':txt,
                'top':top,
                'left':left,
                'color':color
            }).attr('data-txt',txt).css(css).appendTo(_t.$box);
        },

        /* 创建一个箭头标记 */
        addArrow: function(txt, left, top, rotate){
            var _t = this, css = {};
            if(top!=undefined)css.top=top+'%';
            if(left!=undefined)css.left=left+'%';

            return _t.setArrowDeg($('<i class="arrow">'+_t._btns+'</i>').data({
                'type':'a',
                'txt':txt,
                'top':top,
                'left':left,
                'rotate':rotate
            }).attr('data-txt',txt).css(css).appendTo(_t.$box).append($('<span>').text(txt)), rotate);
        },

        /* 通过字串参数批量创建标记 */
        addMarks:function(paramsStrs){
            if(!paramsStrs)return _t;
            var _t = this, marksArr = paramsStrs.split(';');
            for(var i=0,paramsStr; paramsStr=marksArr[i]; i++){
                _t.addMark(paramsStr);
            }
            return _t;
        },

        /* 通过字串参数单个创建标记 */
        addMark:function(paramsStr){
            var _t = this, mdArr = paramsStr.split(','), type = mdArr[0], args = mdArr.splice(1);
            //console.log(mdArr, type, args);
            for(var j=0,mp; mp=args[j]; j++){
                args[j]=unescape(mp);
            }
            return _t[type=='a'?'addArrow':'addPoint'].apply(_t,args).addClass('m-old');
        },


        /* 设置箭头标记旋转角度 */
        setArrowDeg: function($arrow, rotate){
            var rCls = 'removeClass';
            rotate=(+rotate||0)%360;
            if(rotate<0)rotate+=360;

            var cssRotate = rotate;
            if(rotate>90 && rotate<270){
                rCls = 'addClass';
                cssRotate -=180;
            }
            return $arrow[rCls]('aw-right').css('transform','rotate('+cssRotate+'deg)').data('rotate',rotate);
        },

        /* 通过遍历DOM元素，取得标记数据 */
        getMarksData: function(toArr, $mark){
            var data = ($mark||this.$box.find("i")).map(function(i, el){
                return $(el).data()
            });
            if(toArr){
                data = data.map(function(_, markData){
                    var _type = markData.type;
                    return [[
                        _type, 
                        markData.txt, 
                        markData.left, 
                        markData.top, 
                        markData[_type=='a'?'rotate':'color']
                    ]];
                })
            }
            return data;
        },

        /* 获取URI编码后的DOM元素数据 */
        getMarksURI: function($mark, noEscape){
            var _t = this, 
                arr = _t.getMarksData(1, $mark).map(function(_, markParams){
                    for(var i=0,mp; mp=markParams[i]; i++){
                        markParams[i]=noEscape?(mp+'').replace(/,/g,'，').replace(/;/g,'；'):escape(mp);
                    };
                    //console.log(markParams)
                    return markParams.join(',');
                }).toArray();

            return arr.join(';');
        },

        /* 得到分享地址 */
        getShareUrl:function(){
            var _t = this, params = queryUrl(), searchStr = [];

            params.marks = _t.getMarksURI();
            params.edit_mark = null;

            $.each(params,function(key,val){
                val!=null && searchStr.push(key+'='+encodeURIComponent(val));
            });

            return location.href.split('?')[0]+(searchStr.length>0?'?'+searchStr.join('&'):'');
        }
    });

    /*获取url参数*/
    function queryUrl(key,url) {
        url = (url||location.href).replace(/^[^?=]*\?/ig, '').split('#')[0]; //去除网址与hash信息
        var json = {};
        //考虑到key中可能有特殊符号如“[].”等，而[]却有是否被编码的可能，所以，牺牲效率以求严谨，就算传了key参数，也是全部解析url。
        url.replace(/(^|&)([^&=]+)=([^&]*)/g, function (a, b, key , value){
            //对url这样不可信的内容进行decode，可能会抛异常，try一下；另外为了得到最合适的结果，这里要分别try
            try {
                key = decodeURIComponent(key);
            } catch(e) {}
            try {
                value = decodeURIComponent(value);
            } catch(e) {}
            if (!(key in json)) {
                json[key] = /\[\]$/.test(key) ? [value] : value; //如果参数名以[]结尾，则当作数组
            }else if (json[key] instanceof Array) {
                json[key].push(value);
            }else {
                json[key] = [json[key], value];
            }
        });
        return key ? json[key] : json;
    };

    /* 暴露全局变量 */
    window.MarkBox = MarkBox;
    $.queryUrl = queryUrl;

    /* 异步创建样式 */
    $("<style>"+
        ".marks-box{"+
            "position: absolute;"+
            "top: 0;"+
            "left:0;"+
            "right: 0;"+
            "bottom: 0;"+
            "pointer-events: none;"+
        "}"+
        ""+
        ".marks-box i{"+
            "pointer-events: auto;"+
            "position: absolute;"+
            "top: 50%;"+
            "left: 50%;"+
            "font-size: 14px;"+
            "line-height: 16px;"+
            "white-space: nowrap;"+
            "font-style: normal;"+
        "}"+
        ""+
        "/* 操作按钮样式们 */"+
        ".marks-box .m-btns{ "+
            "position: absolute;"+
            "top: 0;"+
            "right: 30%;"+
            "padding: 2px;"+
            "font-size: 12px;"+
            "pointer-events: auto;"+
        "}"+
        ".marks-box i .m-btns{"+
            "top: -22px;"+
            "left: 0px;"+
            "right: auto;"+
            "transform: translate(-50%, -50%);"+
        "}"+
        ".marks-box i.point .m-btns{"+
            "top: -11px;"+
            "left: 6px;"+
        "}"+
        ".marks-box .m-btns a{ "+
            "color: #444;"+
            "text-decoration: none;"+
            "background-color: rgba(255, 255, 255, 0.5);"+
            "padding: 0 4px;"+
            "margin-right: 2px;"+
            "border-radius: 3px;"+
            "box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);"+
            "opacity: 1;"+
        "}"+
        ".marks-box .m-btns a.m-move{"+
            "cursor: move;"+
        "}"+
        ".marks-box .m-btns a.m-rota{"+
            "cursor: w-resize;"+
        "}"+
        ".marks-box .m-btns a.m-tt{"+
            "background-color: rgba(90, 130, 225, 0.5);"+
            "color: #fff;"+
        "}"+
        ".marks-box .m-btns a.m-tt:hover{"+
            "background-color: #5A82E1;"+
        "}"+
        ".marks-box .point .m-btns a.m-rota{"+
            "display: none;"+
        "}"+
        ".marks-box .arrow .m-btns a.m-recl{"+
            "display: none;"+
        "}"+
        ".marks-box .m-add-p:before,"+
        ".marks-box .m-add-a:before{"+
            "content: '→';"+
            "color: #0225A9;"+
            "margin-right: 2px;"+
        "}"+
        ".marks-box .m-add-p:before{"+
            "content: '●';"+
        "}"+
        ""+
        ".marks-box .m-btns:hover{"+
            "z-index: 1002;"+
        "}"+
        ".marks-box .m-btns a:hover{"+
            "background-color: #fff;"+
        "}"+
        ""+
        "/* 箭头样式 */"+
        ".marks-box .arrow span{"+
            "position: absolute;"+
            "top: 50%;"+
            "left: 50%;"+
            "text-shadow: 0 0 1px #000;"+
            "color: #fff;"+
            "padding: 4px 8px 4px 4px;"+
            "border: solid 1px #34DA5F;"+
            "background-color: #0FAD28;"+
            "box-shadow:0 0 0 rgba(255, 255, 255, 0.5), 0 1px 3px rgba(0, 0, 0, 0.6);"+
            "opacity: .6;"+
            "cursor: default;"+
            "transform: translate(-50%, -50%);"+
        "}"+
        ".marks-box .arrow:hover{"+
            "z-index: 9999;"+
        "}"+
        ".marks-box .arrow:hover span{"+
            "opacity: 1;"+
        "}"+
        "/* 左向箭头 */"+
        ".marks-box .arrow span:after,"+
        ".marks-box .arrow span:before{"+
            "content: '';"+
            "position: absolute;"+
            "left: -19px;"+
            "top: 50%;"+
            "margin-top: -20px;"+
            "width: 0;"+
            "height: 0;"+
            "overflow: hidden;"+
            "border: solid 20px rgba(0, 0, 0, 0);"+
            "border-right: solid 20px #0FAD28;"+
            "border-left: none;"+
        "}"+
        ".marks-box .arrow span:before{"+
            "left: -20px;"+
            "margin-top: -20px;"+
            "border-width: 20px;"+
            "border-right: solid 20px #34DA5F;"+
        "}"+
        ""+
        "/* 右向箭头 */"+
        ".marks-box .aw-right span{ "+
            "padding: 4px 4px 4px 8px;"+
        "}"+
        ".marks-box .aw-right span:after,"+
        ".marks-box .aw-right span:before{"+
            "left: auto;"+
            "right: -19px;"+
            "border-right: none;"+
            "border-left: solid 20px #0FAD28;"+
        "}"+
        ".marks-box .aw-right span:before{"+
            "right: -20px;"+
            "border-left: solid 20px #34DA5F;"+
        "}"+
        ""+
        "/* 光点 */"+
        ".marks-box .point{"+
            "top: 51%;"+
            "left: 47%;"+
            "height: 8px;"+
            "width: 8px;"+
            "border-radius: 50%;"+
            "border: solid 1px #FFF;"+
            "background-color: #0080FF;"+
            "box-shadow: 0 0 1px #fff, 0 0 5px #000;"+
            "animation: twinkling 1.5s infinite cubic-bezier(0, 0, 0, 1);"+
            "opacity:.3;"+
        "}"+
        ".marks-box .point:hover{"+
            "z-index: 9999;"+
            "opacity:1;"+
            "animation:none;"+
        "}"+
        ""+
        ".marks-box .point:before,"+
        ".marks-box .point:after {"+
            "position: absolute;"+
            "top: 0; left: 0;"+
            "visibility: hidden;"+
            "opacity: 0;"+
            "pointer-events: none;"+
            "transition: opacity .2s ease-in-out,transform .2s cubic-bezier(.71,1.7,.77,1.24);"+
        "}"+
        ".marks-box .point:before {"+
            "content: '';"+
            "z-index: 1001;"+
            "border: 6px solid transparent;"+
            "border-top: #465F92 solid 8px;"+
            "transform: translate3d(-2px, 0px, 0);"+
        "}"+
        ".marks-box .point:after {"+
            "z-index: 1000;"+
            "padding: 7px 10px;"+
            "background-color: #465F92;"+
            "color: #fff;"+
            "content: attr(data-txt);"+
            "border-radius: 10px;"+
            "border:1px solid #5174BB;"+
            "box-shadow: 0 0px 3px rgba(0, 0, 0, 0.8);"+
            "text-shadow: 0 0 2px #000;"+
            "transform: translate3d(-50%, -30px, 0);"+
        "}"+
        ".marks-box .point:hover:before,"+
        ".marks-box .point:hover:after{"+
            "opacity: 1;"+
            "visibility:visible;"+
            "transform: translate3d(-2px, -9px, 0);"+
        "}"+
        ".marks-box .point:hover:after{"+
            "transform: translate3d(-50%, -40px, 0);"+
        "}"+
        ""+
        "@keyframes twinkling{"+
            "0%{ box-shadow: 0 0 5px #000;}"+
            "50%{ opacity:.8; box-shadow: 0 0 10px #fff;}"+
            "100%{ box-shadow: 0 0 5px #000;}"+
        "}"+
    "</style>").appendTo('head');
})(window,location);
