$('.signin-form').on('submit', function(e) {

    e.preventDefault()

    $.ajax({
        type: "POST", 
        url : $(this).attr('action'),
        data: $(this).serialize(),
        beforeSend: function() {

        },
        success: function(s) {
            iziToast.success({
                title: 'Başarılı',
                message: s.message,
            });

            setTimeout(() => {
              location.href = '/'
            }, 1500)
        },
        error :function(xhr, status, error) {

            const response = JSON.parse(xhr.responseText)
  
            iziToast.error({
                  title: 'Error',
                  message: response.message,
              });
          }
    })
})


$('.news-form').on('submit', function(e) {

    e.preventDefault()

    $.ajax({
        type: "POST", 
        url : $(this).attr('action'),
        data: $(this).serialize(),
        beforeSend: function() {
            $('#submitBtn').addClass('waiting').prop('disabled', true).html('Please wait...');
        },
        success: function(s) {

            $('#submitBtn').removeClass('waiting').prop('disabled', false).html('Submit');

            iziToast.success({
                title: 'Başarılı',
                message: s.message,
            });

            setTimeout(() => {
              location.href = '/'
            }, 1500)
        },
        error :function(xhr, status, error) {

            $('#submitBtn').removeClass('waiting').prop('disabled', false).html('Submit');
            const response = JSON.parse(xhr.responseText)
  
            iziToast.error({
                  title: 'Hata',
                  message: response.message,
              });
          }
    })
})