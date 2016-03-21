/**
 * The loading state service manages the loading state of the application.  
 * Loading occurs when data is being updated in the user interface, and indicates
 * that the data being shown is not yet available or correct.  The loading
 * states are the following:
 *      BACKGROUND: Loading is happening somewhere on the screen, but the data
 *                  visible to the user is not stale (ie: background data is 
 *                  being loaded or processed). Background loading will display
 *                  a UI indicator that loading is happening in the background
 *                  but will allow interaction with the current data on the screen.
 *      BUSY: Loading is happening, and the data being displayed on the screen
 *                  is either stale or not complete.  The normal case will be
 *                  when a screen is still loading data into a grid.  In this 
 *                  case, there will be a UI indication that loading is happening
 *                  and the user will not be able to interact with the data.
 *      IDLE: Loading is NOT happening.  There is no indicator on the screen and
 *                  the user is able to interact with all data.  The data is
 *                  not stale and completely loaded.
 * 
 */
angular.module(
        'com.johnwoconnor.utils'
)
.factory('loadingState', function() {
    var LoadingState = {};
    LoadingState.BUSY = 'BUSY';
    LoadingState.IDLE = 'IDLE';
    LoadingState.state = LoadingState.IDLE;
    
    LoadingState.busy = function() {
        LoadingState.state = LoadingState.BUSY;
    };
    
    LoadingState.idle = function() {
        LoadingState.state = LoadingState.IDLE;
    };
    
    LoadingState.getState = function() {
        return LoadingState.state;
    }
    
    LoadingState.isBusy = function() {
        return LoadingState.state === LoadingState.BUSY;
    }

    LoadingState.isIdle = function() {
        return LoadingState.state === LoadingState.IDLE;
    };
    
    return LoadingState;
});
