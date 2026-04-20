/**
 * 球的点击事件，球号选择和不选择的相互转化
 * object: 对象
 */
function changeRedBall(object) {   
    if ($(object).attr('class') == 'on') {   
        $(object).removeClass();
    } else {
        $(object).removeClass();
        $(object).addClass('on');
    }
} 
/**
 * 对球的全选操作
 * objid: 要操作的ul的 ID
 * len : 要操作的li的个数
 */
function selectAll(objid,len) {
    if(objid=="fanweijihe" || objid=="weijihe" || objid=="weizhijianju" || objid=="shuzileijia"|| objid=="liangmahe_plw"|| objid=="liangmacha_plw" || objid=="jishuhe"|| objid=="jishuhewei"|| objid=="oushuhe"|| objid=="oushuhewei"|| objid=="zhishuhe"|| objid=="zhishuhewei"|| objid=="heshuhe"|| objid=="heshuhewei"){
         var j = 1;
         $('#' + objid).find("li").eq(0).find("a").each(function (){
               $(this).removeClass();    
        }); 
    }else if(objid=="hezhi" || objid=="plw_hz"){
         var j = 0;
          $('#hz_wid1').find("li").eq(0).find("a").each(function (){
               $(this).removeClass();    
        });
    }else{
         var j = 0;
    }
     if(objid=="aotu"){
        for(var i = j; i < len; i++){
            $('#' + objid).find("li").eq(i).each(function (){
                   $(this).addClass('on');    
            });  
        }  
    }else if(objid=="redball_0" || objid=="redball_1"|| objid=="redball_2"|| objid=="redball_3"){
        for(var i = j; i < len; i++){
             $('#' + objid).find("p").eq(i).find("a").each(function (){
                   $(this).addClass('on');    
            });   
        }  
    }else{
        for(var i = j; i < len; i++){
            $('#' + objid).find("li").eq(i).find("a").each(function (){
                   $(this).addClass('on');    
            });  
        }  
    }       
}
/**
 * 对球的全清操作
 * objid: 要操作的ul的 ID
 * len : 要操作的li的个数
 */
function removeAll(objid,len) {
     if(objid=="hezhi" || objid=="plw_hz"){
          $('#hz_wid1').find("li").eq(0).find("a").each(function (){
               $(this).removeClass();    
        });
    }
    if(objid=="aotu"){
        for(var i = 0; i < len; i++){
            $('#' + objid).find("li").eq(i).each(function (){
                    $(this).removeClass();      
            });  
        }  
    }else if(objid=="redball_0" || objid=="redball_1"|| objid=="redball_2"|| objid=="redball_3"){
         for(var i = 0; i < len; i++){
            $('#' + objid).find("p").eq(i).find("a").each(function (){
                    $(this).removeClass();      
            });  
        }    
    }else{
         for(var i = 0; i < len; i++){
            $('#' + objid).find("li").eq(i).find("a").each(function (){
                    $(this).removeClass();      
            });  
        } 
    }
              
}
/**
 * 对球的反选操作
 * objid: 要操作的ul的 ID
  * len : 要操作的li的个数
 */
function selectRev(objid,len) {
    if(objid=="fanweijihe" || objid=="weijihe" || objid=="weizhijianju" || objid=="shuzileijia"|| objid=="liangmahe_plw"|| objid=="liangmacha_plw" || objid=="sanmahe"|| objid=="sanmahewei"|| objid=="jishuhe"|| objid=="jishuhewei"|| objid=="oushuhe"|| objid=="oushuhewei"|| objid=="zhishuhe"|| objid=="zhishuhewei"|| objid=="heshuhe"|| objid=="heshuhewei"){
         var j = 1;
         $('#' + objid).find("li").eq(0).find("a").each(function (){
               $(this).removeClass();    
        }); 
    }else if(objid=="hezhi" || objid=="plw_hz"){
         var j = 0;
          $('#hz_wid1').find("li").eq(0).find("a").each(function (){
               $(this).removeClass();    
        });
    }else{
         var j = 0;
    }
    if(objid=="aotu"){
        for(var i = j; i < len; i++){
            $('#' + objid).find("li").eq(i).each(function (){
                   if($(this).attr("class") == "on"){
                    $(this).removeClass(); 
                    }else{
                        $(this).addClass('on'); 
                    }     
            });  
        }    
    }else if(objid=="redball_0" || objid=="redball_1"|| objid=="redball_2"|| objid=="redball_3"){
         for(var i = j; i < len; i++){
            $('#' + objid).find("p").eq(i).find("a").each(function (){
                   if($(this).attr("class") == "on"){
                    $(this).removeClass(); 
                    }else{
                        $(this).addClass('on'); 
                    }     
            });  
        }    
    }else{
       for(var i = j; i < len; i++){
        $('#' + objid).find("li").eq(i).find("a").each(function (){
               if($(this).attr("class") == "on"){
                $(this).removeClass(); 
                }else{
                    $(this).addClass('on'); 
                }     
        });  
      }   
    
    }        
}

 
/** 
*过滤条件的更多和收起
* object: 对象 
* type: 组选 直选  
*/
function moreOpenAndClose(object,type)
{          
    //显示更多
    if($(object).attr("class") == "factor_more"){    
        $("#factor_more_" + type).show();
        $(object).html('收起');
        $(object).removeClass(); 
        $(object).addClass('factor_up');    
    }else{
        $("#factor_more_" + type).hide();
        $(object).html('更多'); 
        $(object).removeClass(); 
        $(object).addClass('factor_more'); 
    }
   
}

/**
 * 弹出Dialog
 * pageId ：页面ID
 * pageTitle ：页面标题
 * iWidth ：宽度
 * iHeight ：高度
 */
function openSubHtml(pageId, pageTitle, iWidth, iHeight) {  
    $.weeboxs.open(pageId, {title:pageTitle, contentType:'iframe', width:iWidth, height:iHeight});    
}

/**         
 * 设置条件到主页面上，并关闭Dialog
 * paramValue ：条件内容
 * 条件编号 normId  对应首页
 */
function closeWeBox(paramValue,normId) {                              
    parent.addConditions(paramValue,normId);                             
    $("#dialog-mask", parent.document).remove();
    $("#weedialog", parent.document).remove(); 
}  
/**
 * 去除最后一位
 * @param str 字符串
 */
function clickZhYw(str)
{
    return str.substr(0,str.length-1);
}
/**
* 取随机数
*/
function randomSort(a, b) {
    return Math.random() > 0.5 ? -1 : 1;
}
 /**
 * 和值的类型选择
 * typeID :  1 全奇 2 全偶  3 全质 4 全合
 */    
function heZhiType(typeID, ulId) {
     $("#heZhiType1").removeClass();
     $("#heZhiType2").removeClass();
     $("#heZhiType3").removeClass();
     $("#heZhiType4").removeClass();
     $("#heZhiType"+typeID).addClass('on');  
     if(typeID == 3){
          $('#' + ulId).find("a").each(function (i,item){  
               if(is_prime(i)) { 
                    $(this).addClass('on'); 
               }else{
                     $(this).removeClass(); 
               }
          }); 
     }else if(typeID == 4){
        $('#' + ulId).find("a").each(function (i,item){  
               if(!is_prime(i)) { 
                    $(this).addClass('on'); 
               }else{
                     $(this).removeClass(); 
               }
          }); 
     }else if(typeID == 1){
        $('#' + ulId).find("a").each(function (i,item){  
               if(i % 2 != 0) { 
                    $(this).addClass('on'); 
               }else{
                     $(this).removeClass(); 
               }
          }); 
     }else if(typeID == 2){
         $('#' + ulId).find("a").each(function (i,item){  
               if(i % 2 == 0) { 
                    $(this).addClass('on'); 
               }else{
                     $(this).removeClass(); 
               }
          }); 
     }
}  


/**
 * 判断一个数是否为质数
 */
function is_prime(x){
    if(x==0){return false};
    if(x<=3){return true;}
    for(var i=2;i<=Math.sqrt(x);i++){
        if(x%i==0) {
            return false;
        }
    }
    return true;
}
//大小奇偶质合判断
function selectHq(obj,nIndex,mid=4,liId="sub_content")
{
     var divId = "con"; 
     if(liId.indexOf("wei")>0){
          divId = "con1";
     }
    var list = new Array();
    var lists = "";
    //alert(nIndex);
    //循环条件
    var i = 0;
    $("#"+divId).find("a").each(function(){
        if($(this).attr("class") == "on"){
            list[i] = 1;
        } else {
            list[i] = 0;
        }
        i++;
    });
    
    if($(obj).attr("class") == "on"){
        list[nIndex] = 0;
        $(obj).removeClass(); 
    }
    else{
        list[nIndex] = 1;
         $(obj).addClass('on');  
    }
    lists = list.join(",");
    //循环红球
    $("#"+liId).find("a").each(function(){
        var flg1 = true;
        var flg2 = true;
        var flg3 = true;
        //红球
        var value = parseInt($(this).text(),10);
        // 大小
        var daFlg = 0;
        if(value > mid)
        {
            daFlg = 1;
        }
        if(list[0] == 1 || list[1] == 1)
        {
            flg1 = getFlg(list[0],list[1],daFlg);
        }
        //alert(flg+"_"+value);
        
        // 判断奇偶
        if(list[2] == 1 || list[3] == 1)
        {
            flg2 = getFlg(list[2],list[3],value%2);
        }
        // 质合
        if(list[4] == 1 || list[5] == 1)
        {
            flg3 = getFlg(list[4],list[5],isPrimeOrComposite(value));
        }
        
        if(lists.indexOf("1")<0)
        {
            $(this).removeAttr("class");
        }
        else if(flg1 && flg2 && flg3)
        {
            $(this).removeAttr("class").addClass("on");
        }
        else
        {
            $(this).removeAttr("class");
        }
    });
}
/**
 * 判断大小奇偶质合
 * @param flg1  大奇质选中为1未选中为0
 * @param flg2  小偶合选中为1未选中为0 
 * @param flg   红球是奇是偶是大是小
 * @returns {Boolean}
 */

function getFlg(flg1,flg2,flg)
{
    var returnValue = false;
    if(flg1 == 1 &&  flg == 1)
    {
        return true;
    }
    if(flg2 == 1 &&  flg == 0)
    {
        return true;
    }
    return returnValue;
}
/*
*质合
* 质合属性 1质,合0,（默认把1认为是质数，0为合数）  
*/
function isPrimeOrComposite(v){
   var sqtValue  = v;        
   for(var i = 2; i < sqtValue; i++)
    {
       if(v % i == 0)
       {
            return 0; 
       } 
    }
    if(v == 0)
    {
        return 0;
    }
    if(v == 1)
    {
        return 1;
    }
    return 1;       
}


/*****************************************************时时彩共通*************************************************************************/
/**
 * 奇偶大小质和一级快选
 */
function jiouDzZhQuickSelectSsc(object, jiCount, num="") {
    if (object.className == "") {
        object.className = "on";    
        //
        if(jiCount == 0){
            num = num==""?5:num;
            $("#bili").find("a").eq(num).attr("class","on");
        }
        //
        if(jiCount == 1){
            num = num==""?4:num;  
            $("#bili").find("a").eq(num).attr("class","on"); 
        }
        //
        if(jiCount == 2){
             num = num==""?3:num;  
             $("#bili").find("a").eq(num).attr("class","on"); 
        }
        //
        if(jiCount == 3){
             num = num==""?2:num;  
             $("#bili").find("a").eq(num).attr("class","on"); 
        }
        if(jiCount == 4){
             num = num==""?1:num;  
             $("#bili").find("a").eq(num).attr("class","on"); 
        }
        if(jiCount == 5){
             num = num==""?0:num;  
             $("#bili").find("a").eq(num).attr("class","on"); 
        }   
    } else {
        object.className = "";
        if(jiCount == 0){
            num = num==""?5:num; 
            $("#bili").find("a").eq(num).removeClass();
        }
        //
        if(jiCount == 1){
            num = num==""?4:num; 
            $("#bili").find("a").eq(num).removeClass(); 
        }
        //
        if(jiCount == 2){
             num = num==""?3:num; 
             $("#bili").find("a").eq(num).removeClass(); 
        }
        //
        if(jiCount == 3){
             num = num==""?2:num; 
             $("#bili").find("a").eq(num).removeClass(); 
        }
        if(jiCount == 4){
             num = num==""?1:num; 
             $("#bili").find("a").eq(num).removeClass(); 
        }
        if(jiCount == 5){
              num = num==""?0:num; 
             $("#bili").find("a").eq(num).removeClass(); 
        }  
    }    
}

function homegoback(){
     var  pageid = "/list.html";
     var appflg = getCookie("TOOL_APP_FLG");       
     if(appflg=="" || appflg ==null || appflg =="0")
     {
        window.location.href=pageid;  
     }else if(appflg =="2")
     {    
        goBack(); 
     }else if(appflg =="1")
     {
        window.JSAndNativeInterface.close();      
     }         
     
}

function setCookie(name, value) {  
        var Days = 60; //cookie 将被保存两个月   
        var exp = new Date(); //获得当前时间   
        exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000); //换成毫秒  
       document.cookie = name + "=" + escape(value) + ";expires=" + exp.toGMTString();  
    }  
function getCookie(name) {  
        //取出cookie   
        var strCookie = document.cookie;  
        //cookie的保存格式是 分号加空格 "; "  
        var arrCookie = strCookie.split("; ");  
        for ( var i = 0; i < arrCookie.length; i++) {  
            var arr = arrCookie[i].split("=");  
            if (arr[0] == name) {  
                return arr[1];  
            }  
        }  
        return "";  
    } 
    /* 复制号码
*/
function copyNum(id){
   var fromCookie = getCookie("TOOL_APP_FLG"); 
   var str = $('#'+id).text();
   if(str!="" && fromCookie=="1"){
        window.JSAndNativeInterface.CopyToClipboard(str);
   }else if(str!="" && fromCookie=="2"){
         CopyToClipboard(str);  
   }else{
       alert("没有可复制的内容");
   }
  // window.JSAndNativeInterface.showToast(tmeage);
} 







  


