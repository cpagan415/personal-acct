let db;

const request = indexedDB.open('budget_tracker', 1);
request.onupgradeneeded = function(event)
{
    const db = event.target.result;
    db.createObjectStore('new_trans', {autoIncrement: true})
}

//if successful
request.onsuccess = function(event)
{
    db = event.target.result;

    if(navigator.onLine)
    {
        //this a function we do not have yet 
        uploadTrans();
    }
}

request.onerror = function(event)
{
    console.log(event.target.errorCode);
}

//matching the saveRecord() in index.js
function saveRecord(record)
{
    const transaction = db.transaction(['new_trans'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_trans');
    budgetObjectStore.add(record);
}

//uploading data once back online
function uploadTrans()
{
    const transaction = db.transaction(['new_trans'], 'readwrite')
    const budgetObjectStore = transaction.objectStore('new_trans');
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        
        if (getAll.result.length > 0) {
          fetch('/api/transaction/bulk', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
              Accept: 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
            }
          })
            .then(response => response.json())
            .then(serverResponse => {
              if (serverResponse.message) {
                throw new Error(serverResponse);
              }
    
              const transaction = db.transaction(['new_trans'], 'readwrite');
              const budgetObjectStore = transaction.objectStore('new_trans');
              // clear all items in your store
              budgetObjectStore.clear();
            })
            .catch(err => {
              
              console.log(err);
            });
        }
    }
}

//need this to check for network status change
window.addEventListener('online', uploadTrans);