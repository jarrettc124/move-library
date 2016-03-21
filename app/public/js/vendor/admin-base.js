$(function() {
    // If any button with class "destroy" is clicked, prompt the user to make sure they want to delete.
    $('.destroy').live('click', function(e) {
        e.preventDefault();
      if ($(this).is('.disabled')) return;
      if (confirm('Are you sure you want to delete?')) {
        var element = $(this),
            form = $('<form></form>');
        form
          .attr({
            method: 'POST',
            action: element.attr('href')
          })
          .hide()
          .append('<input type="hidden" />')
          .find('input')
          .attr({
            'name': '_method',
            'value': 'del'
          })
          .end()
          .submit();
      }
    });
});

// Set up the date pickers.
$(function() {
    $( ".datepicker" ).datepicker();
});

