<template lang="pug">
div#viewer.container-fluid
    #error(v-if="err.status")
        p {{err.message}}
    #canvas.row
        .viewport
            .viewport-container
                .gsi-ebook
                    .next-button(ignore="1")
                        i.fa.fa-chevron-right(aria-hidden="true")
                    .previous-button(ignore="1")
                        i.fa.fa-chevron-left(aria-hidden="true")
        .page-state
            .page-now
            .page-total
        ControlNav(:handleEvents="handleEvents")
        .slider-control
            #slider-bar.turnjs-slider
                #slider
        .thumb.side-nav
        .xmlMenu.side-nav
        .help.popup-nav(data-container="#app" data-toggle="popover" data-placement="top")
            div.help-toggle
                i.fa.fa-info-circle(aria-hidden="true")
        #printModal.modal(tabindex="-1" role="dialog" aria-labelledby="printModalLabel" aria-hidden="true")
            .modal-dialog(role="document")
                .modal-content
                    .modal-header
                        h5.modal-title {{s[t].printModal[0]}}
                    .modal-body
                        form.print-function-form
                            div.form-check.form-row
                                label.form-check-label
                                    input.form-check-input#printFn01(type="radio" name="printFn" v-model="print.fn" value="1")
                                    div.col-auto {{s[t].printModal[1]}}
                            div.form-check.form-row
                                label.form-check-label
                                    input.form-check-input#printFn02(type="radio" name="printFn" v-model="print.fn" value="2")
                                    div.col-auto
                                        |{{s[t].printModal[2]}}
                                        select.custom-select-sm.mr-2.ml-2(v-model="print.num" @change="customPageHandler")
                                            option(disabled value="") {{s[t].printModal[3]}}
                                            option(v-for="i in 10" , :value="i") {{i}}
                                        |{{s[t].printModal[4]}}
                    .modal-footer
                        button.btn.btn-primary(:disabled="printVaild" @click="actPrint") {{s[t].printModal[5]}}
                        button.btn.btn-secondary(data-dismiss="modal") {{s[t].printModal[6]}}
                        div.loader(v-show="loaderState")
</template>

<script>
import loadBook from '../js/book';
import maga from '../js/magazine';
import axios from 'axios';
import 'print-js/dist/print.min.js';
import '../js/hash';
import ControlNav from './ControlNav.vue';
import waterMarkImg from '../img/watermark.png';

export default {
    data() {
        return {
            bookData: {
                pageWidth : 500,
                pageHeight: 708,
                pageNum   : 10,
                display   : 'double',
                direction : 'ltr',
                duration  : 800,
                lang      : 'zh-tw',
                regionData: null
            },
            err: {
                status    : false,
                message   : 'Error'
            },
            print: {
                modal     : false,
                fn        : '1',
                num       : null
            },
            loaderState   : false,
            s: {
                "ZH-TW": {
                    navTips: ['放大','瀏覽縮圖','目錄','單/雙頁切換','列印','旋轉'],
                    printModal: ['選擇列印範圍', '列印本頁','從本頁起列印','選擇...','頁(每次上限10頁)','確定','取消'],
                    popover:  ['點擊或拖曳翻頁','點擊二下放大']
                },
                "ZH-CN": {
                    navTips: ['放大','浏览缩图','目录','单/双页切换','列印','旋转'],
                    printModal: ['选择列印范围', '列印本页','从本页起列印','选择...','页(每次上限10页)','确定','取消'],
                    popover: ['点击或拖曳翻页','点击二下放大']
                },
                "EN": {
                    navTips: ['Zoom', 'Thumbnail', 'Directory', 'Single / Double Display', 'Print', 'Rotate'],
                    printModal: ['Select Print Range', 'Print this page', 'Print', 'Select...', 'pages from this page. (Limit 10 pages per time)','OK','Cancel'],
                    popover: ['Click arrow or drag to flip book.', 'Double click to zoom in.']
                }
            },
            handleEvents: {
                openPrint: this.openPrint
            }
        }
    },
    components: {
        ControlNav
    },
    computed: {
        printVaild: function () {
            let fn = this.print.fn;
            let num = this.print.num;
            if(fn === null) return true
            if(fn == "1") {
                return false
            } else if(fn == "2") {
                return num === null
            } else {
                return true
            }
        },
        t: function () {
            let lang = this.bookData.lang || 'en';
            return lang.toUpperCase()
        }
    },
    methods: {
        getBook(sTK, sFileID, apiUrl) {
            return new Promise((resolve, reject) => {
                axios({
                    method: 'GET',
                    url: apiUrl,
                }).then((response)=>{
                    const data = response.data;
                    //console.log(data);
                    if (data.iErrorCode === 0) {
                        //console.log('<-- Success -->');
                    } else {
                        //console.log('<-- Invalid -->');
                    }
                    resolve(data);
                }).catch((err)=>{
                    //console.log('<-- Fail load -->');
                    //console.log('[ERR]',err.message);
                    reject(err.message);
                });
            });
        },
        getQuery: function (sSearch) {
            var oGetVars = {};
            if (sSearch.length > 1) {
                for (var aItKey, nKeyId = 0, aCouples = sSearch.substr(1).split("&"); nKeyId < aCouples.length; nKeyId++) {
                    aItKey = aCouples[nKeyId].split("=");
                    oGetVars[decodeURIComponent(aItKey[0])] = aItKey.length > 1 ? decodeURIComponent(aItKey[1]) : "";
                }
            }
            return oGetVars;
        },
        bookInit: async function (data) {
            const vm = this;
            const query = this.getQuery(window.location.search);
            const apiUrl = window.ebookAPI || './';
            console.log(apiUrl);
            try {
                const BookAjax = await this.getBook(query.sTK, query.sFileID, apiUrl);
                console.log(BookAjax);
                //console.log(BookAjax);
                vm.bookData.data = BookAjax;
                vm.bookData.data.lang = query.lang || window.navigator.language;
                vm.bookData.lang = query.lang || window.navigator.language;
                vm.bookData.pageWidth = BookAjax.iX / 2;
                vm.bookData.pageHeight = BookAjax.iY / 2;
                vm.bookData.pageNum = BookAjax.iTotalPage;
                vm.bookData.regionData = BookAjax.regionData;
                if(BookAjax.iErrorCode == '0') {
                    loadBook(vm.bookData);
                    $('[data-toggle="tooltip"]').tooltip({
                        title: function () {
                            let n = parseInt(this.getAttribute('data-navTip'));
                            return vm.s[vm.t].navTips[n]
                        }
                    });
                    $('[data-toggle="popover"]').popover({
                        html: true,
                        offset: '0 -50%',
                        content: vm.s[vm.t].popover[0] +'<br>' + vm.s[vm.t].popover[1]
                    });
                } else {
                    vm.err.status = true;
                    vm.err.message = '權限不足，拒絕存取';
                }
            } catch (error) {
                console.error(error);
                vm.err.status = true;
                vm.err.message = error.toString();
            }
        },
        openPrint() {
            this.print.modal = true;
            $('#printModal').modal();
        },
        actPrint() {
            let vm         = this;
            let path       = this.bookData.data.sDirPath;//圖片位置
            let print      = this.print;//列印選項資料
            let page       = $('.gsi-ebook').turn('page');//當前頁
            let mode       = $('.gsi-ebook').turn('display');
            let pages      = [];//圖片列陣
            let outPage    = print.fn=="2"?print.num:2;//輸出頁數
            let pathParse  = maga.parsePath(path);//解析資料

            vm.loaderState = true;
            if(document.getElementById('printTarget')) {
                let target = document.getElementById('printTarget');
                let prevDiv = target.parentNode;
                document.body.removeChild(prevDiv);
            }

            if (print.fn=="1") {
                //列印本頁
                outPage = (page==1)?1:outPage;
                outPage = (mode=="single")?1:outPage;
                for (let i=0; i<outPage; i++) {
                    let pageString = maga.padLeft(
                            page + i + pathParse.strPage,
                            pathParse.padLeftNum
                        );
                    let pageSrc =  pathParse.path + pageString + '.jpg';
                    pages.push(pageSrc);
                }
            } else if (print.fn=="2") {
                //列印自此往後n頁
                outPage = (outPage>10)?10:outPage;
                for (let i=0; i<outPage; i++) {
                    let pageString = maga.padLeft(
                            page + i + pathParse.strPage,
                            pathParse.padLeftNum
                        );
                    let pageSrc =  pathParse.path + pageString + '.jpg';
                    pages.push(pageSrc);
                }
            }

            var printTabele = document.createElement('table');
            printTabele.style.width = "100%";
            var printDiv = document.createElement('div');
            var promiseArray = [];

            function loadImage(src) {
                return new Promise(function(res,rej){
                    let tr  = document.createElement('tr');
                    let td  = document.createElement('td');
                    tr.style.pageBreakAfter = "always";
                    tr.style.width    = "21.0cm";
                    tr.style.height   = "29.7cm";
                    //tr.style.border   = "1px solid red";
                    tr.style.overflow = "hidden";
                    tr.style.margin   = "0";
                    tr.style.position = "relative";
                    td.style.position = "relative";
                    td.style.overflow = "hidden";
                    td.style.height   = "100%";
                    td.style.width    = "100%";

                    //tr.style.border = "1px solid red";
                    //wm.style.border = "1px solid green";
                    let img = new Image();
                    img.src = src;
                    img.style.width = "100%";
                    td.appendChild(img);
                    tr.appendChild(td);
                    printTabele.appendChild(tr);
                    //img.style.border = "1px solid red";
                    img.onload = function () {
                        let wm = new Image();
                        wm.src = waterMarkImg;

                        wm.style.position = "absolute";
                        wm.style.top      = "30%";
                        wm.style.left     = "0";
                        wm.style.width    = "100%";
                        wm.style.height   = "30%";
                        wm.style.opacity  = "0.5";
                        td.appendChild(wm);
                        wm.onload = function () {
                            res(img);
                        }
                    };
                    img.onerror = function (e) {
                        //rej(e);
                        res(null)
                    }
                });
            }

            for ( let i = 0; i < pages.length; i++) {
                promiseArray.push(loadImage(pages[i]));
            }

            Promise.all(promiseArray).then(function(val){
                //console.log(val);
                printDiv.style.display = "none";
                printTabele.id = "printTarget";
                printDiv.appendChild(printTabele);
                document.body.appendChild(printDiv);
                printJS('printTarget', 'html');
                vm.loaderState = false;
                $('#printModal').modal('hide');
            })
        },
        customPageHandler(evt) {
            this.print.fn = '2';
        }
    },
    mounted() {
        $('#canvas').hide();
        const init = this.bookData;
        this.bookInit(init);
    }
}
</script>

<style lang="stylus" src="../css/book.styl"></style>
