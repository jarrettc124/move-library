$(document).ready(function() {
    $('.imageUrl').blur(function() {
        var imageUrl = $(this);
        var url = $(this).val();
        console.log("This url = " + url);
        if (url === "" || url === null || typeof(url) === undefined) {
            console.log("setting to placeholder");
            $(this).attr("src", "http://placehold.it/200x200");
        } else {
            var image = imageUrl.closest(".imageLoader").find(".image").attr("src", url);
        }
    });
});