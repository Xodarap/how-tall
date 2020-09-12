/*!
 * Start Bootstrap - Creative Bootstrap Theme (http://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see http://www.apache.org/licenses/LICENSE-2.0.
 */
const cipher = salt => {
    const textToChars = text => text.split('').map(c => c.charCodeAt(0));
    const byteHex = n => ("0" + Number(n).toString(16)).substr(-2);
    const applySaltToChar = code => textToChars(salt).reduce((a,b) => a ^ b, code);

    return text => text.split('')
        .map(textToChars)
        .map(applySaltToChar)
        .map(byteHex)
        .join('');
}

const decipher = salt => {
    const textToChars = text => text.split('').map(c => c.charCodeAt(0));
    const applySaltToChar = code => textToChars(salt).reduce((a,b) => a ^ b, code);
    return encoded => encoded.match(/.{1,2}/g)
        .map(hex => parseInt(hex, 16))
        .map(applySaltToChar)
        .map(charCode => String.fromCharCode(charCode))
        .join('');
}
class Result {
    constructor(result){
        this.result = result;
        this.general = this.generalDetection();
    }
    
    generalDetection() {
        
        debugger;
    }
}

(function($) {
    "use strict"; // Start of use strict

    // jQuery for page scrolling feature - requires jQuery Easing plugin
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: ($($anchor.attr('href')).offset().top - 50)
        }, 1250, 'easeInOutExpo');
        event.preventDefault();
    });

    // Highlight the top nav as scrolling occurs
    $('body').scrollspy({
        target: '.navbar-fixed-top',
        offset: 51
    })

    // Closes the Responsive Menu on Menu Item Click
    $('.navbar-collapse ul li a').click(function() {
        $('.navbar-toggle:visible').click();
    });

    // Fit Text Plugin for Main Header
    $("h1").fitText(
        1.2, {
            minFontSize: '35px',
            maxFontSize: '65px'
        }
    );

    // Offset for Main Navigation
    $('#mainNav').affix({
        offset: {
            top: 100
        }
    })

    // Initialize WOW.js Scrolling Animations
    new WOW().init();

    var validateImage = function() {
        var files = $('#photo')[0].files;
        if(!files || files.length == 0){            
            $('#photoError').show();
            return false;
        }
        if(files[0].type.slice(0,6) !== 'image/'){
            $('#photoError').show();
            return false;        
        }
        $('#photoError').hide();
        return true;
    }

    $('#photo').on('change', function(){        
        if(!validateImage()){
            return;
        }

        var reader = new FileReader();
        reader.onloadend = function(event) {
            $('#preview').attr('src', event.target.result);

            var img = new Image();
            $(img).on('load', function(imgEvent) {
                var ratio = img.naturalHeight / img.naturalWidth;
                img.height = img.naturalHeight;
                img.width = img.naturalWidth;
                if(ratio < 0.8 || ratio > 1.3) {
                    $('#dimensionError').show();
                } else {
                    $('#dimensionError').hide();
                }
            });
            img.src = event.target.result;
        }
        var files = $('#photo')[0].files;
        if(files && files.length > 0){
            $('#preview').show();
            reader.readAsDataURL(files[0]);
        } 
    })

    var validate = function () {
        return validateImage();
    }
    
    $('#photo').on('blur', validate);

    var resizeImage = function(file, cb) {
        var img = document.createElement("img");
        var reader = new FileReader();  
        reader.onload = function(e) {
            img.src = e.target.result;
            var canvas = document.createElement('canvas');
            canvas.style.display = 'none';
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            var MAX_WIDTH = 102400;
            var MAX_HEIGHT = 102400;
            var width = img.width;
            var height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            img.width = canvas.width;
            img.height = canvas.height;

            cb(canvas, e.target.result);
        }
        reader.readAsDataURL(file);
    };

    $('#ratingForm').submit(function(event){
        event.preventDefault();
        if(!validate()) {
            return;
        }

        $('#loaderHolder').show();
        var file = $('#photo')[0].files[0];
        var after = function(canvas, result) {
            var data = 
            {
                "requests": [
                  {
                    "image": {
                      "content": result.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "")   
                    },
                    "features": [
                      {
                        "maxResults": 10,
                        "type": "OBJECT_LOCALIZATION"
                      },
                    ]
                  }
                ]
              }
            
            data = JSON.stringify(data);
            var url = 'https://vision.googleapis.com/v1/images:annotate?key=' + decipher('how-tall')("090132291b310b191f04290d7a11187b2d21013d1c232a7a2711221f0f3c0704210c06001f7c2f")
            $.ajax({url: url, 
                data: data,
                type: 'POST',
                contentType: 'application/json',
                processData: true,
                headers: {'content-type': 'application/json'},
                success: function(result){
                    //new Result(result);
                    var r = result.responses[0].localizedObjectAnnotations;
                    $('#loaderHolder').hide();
                    $('#resultsHolder').show();
                    $('#resultText').text(
                        r.map(x => x.name).join(',')
                    )
                }   
            });   
        };
        resizeImage(file, after);
    });

})(jQuery); // End of use strict
