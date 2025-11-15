/* 
$( document ).delegate("#aboutPage", "pageinit", function() {
  alert('A page with an ID of "aboutPage" was just created by jQuery Mobile!');
});
*/

 $(function() {
    $('.switch').click( function () {
        if ($(this).find("input").prop('checked')){				//Switch is on so set it off
            $(this).find("label").removeClass('switchChecked').addClass('switchUnchecked');
            $(this).find("span").removeClass('switchChecked').addClass('switchUnchecked');
            $(this).find("i").removeClass('switchChecked').addClass('switchUnchecked');
			$(this).find("input").prop('checked', false);
        } else {												//Switch is off so set it on
            $(this).find("label").removeClass('switchUnchecked').addClass('switchChecked');
            $(this).find("span").removeClass('switchUnchecked').addClass('switchChecked');
            $(this).find("i").removeClass('switchUnchecked').addClass('switchChecked');
			$(this).find("input").prop('checked', true);
        }
    });
});

