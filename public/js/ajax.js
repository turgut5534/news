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
            }, 1)
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


$('.delete-news').on('click', function(e) {
    e.preventDefault()

    Swal.fire({
        title: 'Emin misiniz?',
        text: "Haber silinecektir. Onaylıyor musunuz?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Evet',
        cancelButtonText: 'Hayır'
      }).then((result) => {
        if (result.isConfirmed) {

            const id = $(this).data('id')

            $.ajax({
            type: "GET",
            url : "/delete/"+id,
            data: { id: id} ,
            success: function() {
                iziToast.success({
                    title: 'Başarılı',
                    message: 'Başarıyla Silindi!',
                });
              
                $('.news-'+ id).remove()

                const count = $('.news').length;
                if(count == 0) {
                    $('.newsRow').append(`<p class="text-center h1">Haber bulunamadı</p>`)
                }

            },
            error: function (e) {
                console.log(e)
            }
            })
        }
      })
})

$('.delete-tag').on('click', function(e) {
    e.preventDefault()

    Swal.fire({
        title: 'Emin misiniz?',
        text: "Haber silinecektir. Onaylıyor musunuz?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Evet',
        cancelButtonText: 'Hayır'
      }).then((result) => {
        if (result.isConfirmed) {

            const id = $(this).data('id')

            $.ajax({
            type: "GET",
            url : "/tags/delete/" +id ,
            success: function() {

                iziToast.success({
                    title: 'Başarılı',
                    message: 'Başarıyla Silindi!',
                });
                $('.tag-'+ id).remove()

                const count = $('.tags').length;
                if(count == 0) {
                    $('.tagsRow').append(`<p class="text-center h1">Etiket bulunamadı</p>`)
                }
            },
            error: function (e) {
                console.log(e)
            }
            })
        }
      })
})


