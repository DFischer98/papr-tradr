//when user finishes typing stock ticker, fetch info on typed stock and verify
//timing functions courtesy of https://stackoverflow.com/questions/4220126/

//setup before functions
let typingTimer;                //timer identifier
let doneTypingInterval = 1500;  //time in ms, 5 second for example
let inputField = document.getElementById('ticker-input');
let tickerDesc = document.getElementById('ticker-info');
let tickerDescText = tickerDesc.appendChild(document.createTextNode(''));
let submitButton = document.getElementById('new-trade-submit');

submitButton.disabled = true;

//on keyup, start the countdown
inputField.addEventListener('keyup', function () {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(doneTyping, doneTypingInterval);
  tickerDescText.nodeValue = 'Loading...';
  tickerDesc.classList.remove('valid-stock', 'invalid-stock');
  tickerDesc.classList.add('loading-stock');
  submitButton.disabled = true;
});

//on keydown, clear the countdown
inputField.addEventListener('keydown', function () {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(doneTyping, doneTypingInterval);

});

//user has stopped typing long enough for us to assume they finished input
function doneTyping () {
    let ticker = inputField.value;
    let apiReq = new XMLHttpRequest();
    apiReq.open("GET", `https://api.iextrading.com/1.0/stock/${ticker}/batch?types=quote`, true);
    apiReq.send();
    apiReq.onloadend = resListener;
}
function resListener(){
    if(this.status == 404){
        tickerDescText.nodeValue = "Stock not found.";
        tickerDesc.classList.remove('valid-stock', 'loading-stock');
        tickerDesc.classList.add('invalid-stock');
        submitButton.disabled = true;
    }

    else{
        let resObj = JSON.parse(this.responseText);
        tickerDescText.nodeValue = resObj.quote.companyName;
        tickerDesc.classList.remove('invalid-stock', 'loading-stock');
        tickerDesc.classList.add('valid-stock');
        submitButton.disabled = false;
    }
}
