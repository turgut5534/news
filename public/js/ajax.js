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