// === Please see README for detailed search method explanation. ===

'use strict';

var previousSearch = '',
    continueSettings = '',
    sroffsetSettings = '',
    batchResults = null;

//helper method to Ajax titles consecutively but not asynchronously
function searchPageTitle(pageTitles, pageTitleIndex, len, isNewSearch){
  //get detailed page info (see top for explanation)
  var detailDataSettings = {
    action: 'query',
    format: 'json',
    prop: 'extracts|pageimages',
    exchars: 300,
    explaintext: 'true',
    exintro: 'true',
    piprop: 'thumbnail',
    pithumbsize: 300, //width
    titles: pageTitles[pageTitleIndex]
  };
      
  $.ajax({
    url: 'https://en.wikipedia.org/w/api.php',
    dataType: 'jsonp',
    data: detailDataSettings,
    success: function(detailData){
      var detailPages = detailData.query.pages;
      //console.log(detailPages);
            
      $.map(detailPages, function(page){  
        //console.log(page);
        var result = $('<div class="result">');
      
        //append title and link
        var url = 'https://en.wikipedia.org/wiki/' + pageTitles[pageTitleIndex].replace(/ /g, '_');
        result.append($('<h2>').html('<a class="wiki-serif" target="_blank" rel="noopener noreferrer" href="' + url + '">' + pageTitles[pageTitleIndex] + '</a>'));
                
        //append image
        if (page.thumbnail){
          var thumbContainer = $('<div class="result-thumbnail-container">');
          result.append(thumbContainer.append($('<img class="result-thumbnail">').attr('src', page.thumbnail.source)));
        }

        //append extract and finish
        result.append($('<p>').html(page.extract));
        result.append($('<hr class="hr-result">'));
        batchResults.append(result);
      });

      if (pageTitleIndex != len-1){
        searchPageTitle(pageTitles, pageTitleIndex+1, len);
      } else {
        //console.log("Done Searching Titles");
        if (!isNewSearch){
          $('.hr-result').show();
        }
        $('#search-results').append(batchResults);
        $('.hr-result').last().hide();
        $('#loading-new').hide();
        $('#loading-more').hide();
        $('#txt-search').autocomplete('close');
        $('#results-container').fadeIn();
        continueSettings != '' ? $('#btn-more').show() : $('#btn-more').hide();
      }        
    },
    error: function(err){
      console.log(err);
    }
  });
}

//gets and displays page details
function searchPageTitles(pageTitles, isNewSearch){
  //console.log(pageTitles);
  var pageTitleIndex = 0;
  var len = pageTitles.length;
  $('#txt-search').autocomplete('close');
  batchResults = $('<div class="batch-results">');
    
  searchPageTitle(pageTitles, pageTitleIndex, len, isNewSearch);
}

//gets accurate search results as page titles
function searchWiki(searchTerm, isNewSearch){
  $('#btn-more').hide();
  $('#no-results').hide();
  
  var dataSettings = {
      action: 'query',
      format: 'json',
      redirects: 'true',
      list: 'search',
      srsearch: searchTerm,
      srlimit: 10,
      //these next two settings allow you to continue searching from where the last request ended
      continue: continueSettings,
      sroffset: sroffsetSettings
  };
    
  if (isNewSearch){
      dataSettings.continue = '';
      dataSettings.sroffset = '';
      $('#results-container').hide();
      $('#search-results').html('');
      $('#loading-new').show();
  } else {
      $('#loading-more').show();
  }
    
  var pageTitles = [];
    
  $.ajax({
    url: 'https://en.wikipedia.org/w/api.php',
    dataType: 'jsonp',
    data: dataSettings,
    success: function(data){
      //console.log(data);
      var pages = data.query.search;

      if (pages.length != 0){
        //parse for page titles
        $.map(pages, function(page){
          pageTitles.push(page.title);
        });

        previousSearch = searchTerm;

        if (data.continue != undefined){
          continueSettings = data.continue.continue;
          sroffsetSettings = data.continue.sroffset;
        } else {
          continueSettings = '';
          sroffsetSettings = '';
        }

        searchPageTitles(pageTitles, isNewSearch);
      } else {
        $('#loading-new').hide();
        $('#no-results').show();
      }
    },
    error: function(err){
      console.log(err);
    }
  });  
}

$(document).ready(function(){
  $('#btn-search').on('click', function(e){
    var searchTxt = $('#txt-search').val();
    if(searchTxt != ''){
      $('#txt-search').autocomplete('close');
      searchWiki(searchTxt, true);
      //prevents default and propagation
      return false;
    }
  });
  
  $('#txt-search').keypress(function(e){
    var searchTxt = $('#txt-search').val();
    if(searchTxt != ''){
      //presses enter
      if (e.which == 13) {
        $('#txt-search').autocomplete('close');
        searchWiki(searchTxt, true);
        return false;
      }
    }
  });
  
  $('#btn-more').on('click', function(e){
    searchWiki(previousSearch, false);           
  });
  
  //jQuery UI autocomplete
  $('#txt-search').autocomplete({
    source: function(request, response){
      var dataSettings = {
        //only need to request page titles
        'action': "opensearch",
        'format': "json",
        'search': request.term
      };
      
      $.ajax({
        url: 'https://en.wikipedia.org/w/api.php',
        dataType: 'jsonp',
        data: dataSettings,
        success: function(data){
          response(data[1]);
        },
        error: function(err){
          response([]);
        }
      });
    }
  });
    
});