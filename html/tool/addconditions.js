/**
 * 选择投注类型 直选 组选 切换
 * id ：投注类型 zuxuan  zhixuan
 */
function changeActionType(id) {
    if (id == 'zhixuan') {
        //直选 
        if ($('#zuxuanLi').attr('class') == "on") {
             if (!clearAll(1)) {
                return;
            }
        }   
        $('#zhixuanLi,#zuxuanLi').removeClass();
        $('#zhixuanLi').addClass('on');
        
        $('#zhixuanDiv').show();
        $('#zuxuanDiv').hide(); 
        
        //设置投注类型  直选：1  
        $('#typeFlg').attr('value', '1'); 
        //指标列表
        var normList =  $("#indexNormList").val(); 
      
          
    } else {           
        //组选
        if ($('#zhixuanLi').attr('class') == "on") { 
            //清空过滤条件
            if (!clearAll(2)) {
                return;
            }
        }  
        $('#zuxuanLi,#zhixuanLi').removeClass();
        $('#zuxuanLi').addClass('on'); 
        
        $('#zhixuanDiv').hide();
        $('#zuxuanDiv').show();

        //设置投注类型  组选：2  
        $('#typeFlg').attr('value', '2');
         //指标列表
        var normList =  $("#indexNormListZu").val();  
    } 
    var normListArr= normList.split(",");
    var normId=""; 
    $("#factor_list_zhixuan").find('li').each(function(){     //条件标红去掉
         $(this).hide();
         normId = $(this).attr("id").substring(5);  
         if($.inArray(normId, normListArr)>=0 || normId == "more"){
            $(this).show();
         }  
    }); 
      
}
/**
 * 组三 组六的选择
 * flgType ：组选类型
 */
function setType(flgType){  
    //设置过滤类型
    $('#typeFlg').attr('value', flgType); 
    
    if (flgType == 3) {
        //组3         
        if ($('#btnZu3').attr('class') == 'chex') {   
            $('#btnZu3').removeClass();
            //组3，组6都没选上时，过滤类型为2 
            if ($('#btnZu6').attr('class') == 'chex') {
                $('#typeFlg').attr('value', '4');
            } else {
                $('#typeFlg').attr('value', '2');
            }
            
        } else {
            $('#btnZu3').removeClass();
            $('#btnZu3').addClass('chex');
            //组3，组6都选上时，过滤类型为2 
            if ($('#btnZu6').attr('class') == 'chex') {
                $('#typeFlg').attr('value', '2');
            } 
        } 
    } else {
        //组6              
        if ($('#btnZu6').attr('class') == 'chex') {   
            $('#btnZu6').removeClass();
            //组3，组6都没选上时，过滤类型为2 
            if ($('#btnZu3').attr('class') == 'chex') {
                $('#typeFlg').attr('value', '3');
            } else {
                $('#typeFlg').attr('value', '2');
            }
           
        } else {
            $('#btnZu6').removeClass();
            $('#btnZu6').addClass('chex');
             //组3，组6都选上时，过滤类型为2 
            if ($('#btnZu3').attr('class') == 'chex') {
                $('#typeFlg').attr('value', '2');
            }
            
        } 
    }
}  


/**
 * 清空所有条件
 * type ：类型  1 直选 2 组选 
 */
function clearAll(type) {   
     //表格数组  
    $("#resultContent").html(''); 
    //注数
    $('#resultNum').html(0); 
    //金额 = 注数 * 投注倍数 * 2
    $('#resultMoney').html(0);         
    $("#glConditionsTable").find("tbody").remove();  //存条件的table清空
    $(".factor_list").find('li').each(function(){     //条件标红去掉
       $(this).find("a").removeClass('on');
    });
    return true;
}




/**         
 * 主页面上获取子页面数据的函数
 * strConditions ：条件内容
 * 条件编号 normId 
 */
function addConditions(strConditions,normId) {  
  
    var tempArray = null; 
     var tempArray = null; 
    var obj = document.getElementById("condition_"+normId); 
    if (obj){ 
         $("#condition_"+normId).remove();      
    }  
    //如果没有选择条件，则退出
    if (strConditions == null || strConditions == "" || strConditions == "undefined") { 
        $("#norm_"+normId).find("a").removeClass(); 
        return; 
    } 
      
    $('#glConditionsTable').append('<tr id="condition_'+ normId +'"><td>' + clickZhYw(strConditions) + '</td></tr>');  
    $("#norm_"+normId).find("a").addClass('on');                       
}  


/**
 * 过滤号码
 * lotteryId ：彩种
 * isAll :是否机选20注
 */
function filterNum(lotteryId,isAll){

    //如果没有过滤条件   
    if ($("#glConditionsTable").children("tbody").children("tr").length == 0) { 
        //把选择的号码直选组选出一套结果  （0代表没有指标） 
        var arrOriginalNum = setListNum(0);  
        var numList = new Array();    
        if(isAll==2 && arrOriginalNum.length>20){   //机选20注
            
             var rndarr = arrOriginalNum.sort(randomSort);        
             numList =  rndarr.slice(0,20)             
        }else{
            numList = arrOriginalNum;
        }                                             
       if(numList){                                            
            //表格数组 
            var re = new RegExp(",","g"); 
            $("#resultContent").html(numList.join("  ").replace(re,'')); 
            //注数
            $('#resultNum').html(numList.length); 
            //金额 = 注数 * 投注倍数 * 2
            $('#resultMoney').html(numList.length * 2); 
        }
    } else {                       
        //把选择的号码直选组选出一套结果  （1代表有指标）
        var arrOriginalNum = setListNum(1); 
       // var length = arrOriginalNum.length;   
//        var arrTemp = new Array();
//        for (var i = 0; i < length; i++) {
            //号码的每个号之间用空格分割
//            arrTemp[i] = arrOriginalNum[i].join(' ');
//        }
        //每注号码之间用@@分割
        var strOriginalNum = arrOriginalNum.join('@@');                                
        //过滤列表中的数据进行过滤      
        var strConditionValue =  getConditions();  //获取过滤条件 
         var lspcdata =  $("#lspcdata").val();  //历史排除   
        //组选还是直选   直选：1
        var strZhixuan = $('#typeFlg').val();
                  
        $.post(
            APPurl+'?m=Shuzi&a=filters', 
            {
                strOriginalNum:strOriginalNum,
                strCondition:strConditionValue, //条件
                lspcdata:lspcdata, //历史排除数据
                isAll:isAll, //是否机选20注
            },
            function(data) {   
               if(data == 0){
                    alert("抱歉,本次过滤缩水的结果为空。");
               }else{
                    var re = new RegExp(",","g"); 
                    var arr = data.split(" ");
                    //表格数组  
                    $("#resultContent").html(data.replace(re,'')); 
                    //注数
                    $('#resultNum').html(arr.length);
                    //金额 = 注数  * 2
                    $('#resultMoney').html(arr.length * 2);
               }
            }
        );
    } 
}

/**
 * 根据选择的号码生成数据列表
 * flg 1 直选 2： 组选
 * condtionstype:过滤状态： 0：无指标  1： 有指标
 */
function setListNum(conditionsType) {
   $('#resultContent').html('正在过滤.....');  
    var flg = $('#typeFlg').val(); 
           
    if (flg == 1) {
        //直选          
        //百位号码
        var hundredNumList = getSelectedBallNumList("bai_ball");
        //十位号码
        var tenNumList = getSelectedBallNumList("shi_ball");
        //个位号码
        var oneNumList = getSelectedBallNumList("ge_ball");   
    } else {    
        //组选                            
        var zxNumList = getSelectedBallNumList("zuxuan"); 
    }                                               
        var numList = new Array(zxNumList); 
    if (flg == 1) {
        //直选
        numList = setDataFor3dAll(hundredNumList, tenNumList, oneNumList); 
    } else if (flg == 2) {
        //组选
        numList = setDataFor3dZuxuan(zxNumList, zxNumList, zxNumList, 1);   
    } else if (flg == 3) {
        //组三
        numList = setDataFor3dZuxuan(zxNumList, zxNumList, zxNumList, 2);
    } else if (flg == 4) {
        //组六
        numList = setDataFor3dZuxuan(zxNumList, zxNumList, zxNumList, 3); 
    }                
         
        if(numList.length == 0 || !numList){
            alert("请选择号码！");
            $('#resultContent').html(''); 
            $('#resultNum').html(0);
            $('#resultMoney').html(0);    
            return;
        }else{
          return numList;
        }                  
}
/**
 * 取得选择的球的号码
 * liName 球所在li ID的前缀
 */
function getSelectedBallNumList(liName) {
    var numList = new Array();
    $('#' + liName).find("a").each(function (){
        if($(this).attr("class") == "on"){
            numList.push($(this).html());         
        }     
    });  
    return numList;
}
/**
 * 生成3D直选号码
 * hundredslNum ：百位号码
 * tensNum ：十位号码
 * onesNum ：个位号码
 */
function setDataFor3dAll(hundredslNum, tensNum, onesNum) { 
    //返回生成数据的数组
    returnList = new Array();
    //判断数据的值
    if (hundredslNum == null || tensNum == null || onesNum == null) {
        return false;
    }
    var index = 0;
    for (i = 0; i < hundredslNum.length; i++) {
        for (j = 0; j < tensNum.length; j++) {
            for (k = 0; k < onesNum.length; k++) {  
                  var tenmArray = new Array();
                  tenmArray[0] = hundredslNum[i];
                  tenmArray[1] = tensNum[j];
                  tenmArray[2] = onesNum[k];
                  returnList[index] = tenmArray;
                  index++;   
            }    
        }    
    }         
    return returnList;
}
/**
 * 生成3D组选选号码
 * hundredslNum ：百位号码
 * tensNum ：十位号码
 * onesNum ：个位号码
 * typeFlg ：1:组选 2:组三 3:组六 4:组选+豹子号
 */
function setDataFor3dZuxuan(hundredslNum, tensNum, onesNum, typeFlg) { 
    //返回生成数据的数组
    var returnList = new Array();
    var valueList = new Array();
    returnList = setDataFor3dAll(hundredslNum, tensNum, onesNum);
    if (returnList == false) {
        return false;
    }  
    for (var i = 0; i < returnList.length; i++) {
        var tempValueList= new Array();
        tempValueList = returnList[i];
        tempValue = tempValueList.sort();
        if (arraySearch(valueList,tempValue) == false) {
            if (typeFlg == 1) { 
                //组3组6 
                if (!(tempValue[0] == tempValue[1] && tempValue[0] == tempValue[2])) {
                    valueList.push(tempValue);
                }
            } else if (typeFlg == 2) {
                //组三
                if ((tempValue[0] == tempValue[1] && tempValue[0] != tempValue[2])
                  || (tempValue[1] == tempValue[2] && tempValue[0] != tempValue[2])) {
                    valueList.push(tempValue);
                } 
            } else if (typeFlg == 3) {
                //组六
                if (tempValue[0] != tempValue[1] && tempValue[0] != tempValue[2] && tempValue[1] != tempValue[2]) {
                    valueList.push(tempValue);
                }
            } else if (typeFlg == 4) {
                //组选 + 豹子号
                valueList.push(tempValue);
            }
        }
    }
    return valueList; 
} 
/**
 * 判断一个一维数组是一个二维数组的元素
 * list ：二维数组
 * value ：一维数组
 */
function arraySearch(list, value) {

    if(list == null || list.length <= 0 ) {
        return false;
    }
    for(var j = 0; j < list.length;j++) {
        if(listCompare(list[j], value) == true) {
            return true;
        }
    }
    return false;
}

/**
 * 判断一个数组是否包含另一个数组
 * oneList ：元数组
 * twoList ：被包含的数组
 */
function listCompare(oneList, twoList) {
    if (oneList == null || twoList == null) {
        return false;
    }
    if (oneList.length != twoList.length) {
        return false;
    }
    for (var i = 0; i < oneList.length; i++) {
        if (oneList[i] != twoList[i]) {
            return false;
        }
    }
    return true;
}

 /**
 * 取得过滤条件
 */
function getConditions(){
     //获取table对象
    var table = $("#glConditionsTable");
    
    var length = $("#glConditionsTable tbody tr").length;
    var arrayList = new Array();   
    
    /*****************************************/  
    var tempObject = new Object();
    //条件
    var strConditions = '';  
    for (var i = 0; i < length; i++) {
        tempObject = $('#glConditionsTable tbody tr:eq('+i+')');
        //条件 
        strConditions = tempObject.children('td:eq(0)').html();   
        //条件，保留排除，容错之间用**分割
        arrayList.push(strConditions);
    }         
    /*****************************************/                
    //不同条件之间用==分割 
    return arrayList.join('==');
}