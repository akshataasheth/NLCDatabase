import axios from 'axios'; //required for making requests to backend
import { setAlert } from './alert'; //need to set alerts for certain places
import XLSX from 'xlsx';
import saveAs from 'file-saver';
//import types
import {
  GET_PROFILE,
  PROFILE_ERROR,
  UPDATE_PROFILE,
  CLEAR_PROFILE,
  ACCOUNT_DELETED,
  GET_PROFILES,
  GET_SEARCHENTRY
} from './types';

//Get current user's profile

export const getCurrentProfile = () => async dispatch => {
  try {
    console.log('Hell0');
    const res = await axios.get('api/profile/me');
    console.log('hello1');
    console.log(res.data);
    dispatch({
      type: GET_PROFILES,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status } //we have an error in our state
    });
  }
};

//get all profiles
export const getProfiles = () => async dispatch => {
  dispatch({ type: CLEAR_PROFILE }); //when they go to the profile list page, clear what is in the current profile
  try {
    const res = await axios.get('api/profile');
    console.log(res.data);
    dispatch({
      type: GET_PROFILE,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status } //we have an error in our state
    });
  }
};

//get profile by id
export const getProfileById = userId => async dispatch => {
  try {
    const res = await axios.get(`api/profile/${userId}`);
    console.log(res.data);
    dispatch({
      type: GET_PROFILE,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status } //we have an error in our state
    });
  }
};

// //Get search history --> function not being used.
// export const getSearchHistory = () => async dispatch => {
//   try {
//     const res = await axios.get('api/profile/searchHistory/me');
//     console.log(res.data);
//     dispatch({
//       type: GET_SEARCHHISTORY,
//       payload: res.data
//     });
//   } catch (err) {
//     dispatch({
//       type: PROFILE_ERROR,
//       payload: { msg: err.response.statusText, status: err.response.status } //we have an error in our state
//     });
//   }
// };

//Create or update profile
export const createProfile = (
  formData,
  history,
  edit = false
) => async dispatch => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    const res = await axios.post('/api/profile', formData, config);
    dispatch({
      type: GET_PROFILE,
      payload: res.data
    });

    dispatch(setAlert(edit ? 'Profile Updated' : 'Profile Created', 'success'));
    if (!edit) {
      history.push('/dashboard');
    }
  } catch (err) {
    const errors = err.response.data.errors;
    if (errors) {
      errors.forEach(error => dispatch(setAlert(error.msg, 'danger')));
    }
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status }
    });
  }
};

//Add searchHistory --> use this for adding to search history after someone uses the search bar
export const addSearchHistory = formData => async dispatch => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    const res = await axios.put('/api/profile/searchHistory', formData, config);
    dispatch({
      type: UPDATE_PROFILE,
      payload: res.data
    });

    dispatch(setAlert('Added to Search History', 'success'));
  } catch (err) {
    const errors = err.response.data.errors;
    if (errors) {
      errors.forEach(error => dispatch(setAlert(error.msg, 'danger')));
    }
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status }
    });
  }
};

//get SearchEntry by id

export const getSearchEntryById = entry_id => async dispatch => {
  try {
    const res = await axios.get(`/api/profile/searchHistory/${entry_id}`);
    dispatch({
      type: GET_SEARCHENTRY,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status }
    });
  }
};

//Delete search history
export const deleteSearchHistory = id => async dispatch => {
  try {
    const res = await axios.delete(`/api/profile/searchHistory/${id}`);
    dispatch({
      type: UPDATE_PROFILE,
      payload: res.data
    });

    dispatch(setAlert('Search Entry Removed', 'success'));
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status }
    });
  }
};

//Delete account and profile
export const deleteAccount = () => async dispatch => {
  if (window.confirm('Are you sure? This cannot be undone.')) {
    try {
      await axios.delete(`/api/profile`);
      dispatch({ type: CLEAR_PROFILE });
      dispatch({ type: ACCOUNT_DELETED });
      dispatch(setAlert('Your account has been permanantly deleted'));
    } catch (err) {
      dispatch({
        type: PROFILE_ERROR,
        payload: { msg: err.response.statusText, status: err.response.status }
      });
    }
  }
};

//export to excel
export const exportToExcel = entry => async dispatch => {
  try {
    var wb = XLSX.utils.book_new();
    wb.props = {
      Title: entry.searchString
    };
    wb.SheetNames.push(entry.searchString);
    var ws_data = [
      [entry.searchString, entry.searchDate],
      [
        'Unique ID',
        'Program Name',
        'Date',
        'City',
        'State',
        'Station',
        'Viewership',
        'Total Viewership',
        'Full Text',
        'Video Link'
      ]
    ];

    entry.searchResults.forEach(function(x) {
      ws_data.push([
        x._id,
        x.programName,
        x.date,
        x.city,
        x.state,
        x.station,
        x.viewership,
        x.totalViewership,
        x.fullText,
        x.videoLink
      ]);
    });

    var ws = XLSX.utils.aoa_to_sheet(ws_data);

    wb.Sheets[entry.searchString] = ws;

    var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    var buf = new ArrayBuffer(wbout.length); //convert s to arrayBuffer
    var view = new Uint8Array(buf); //create uint8array as viewer
    for (var i = 0; i < wbout.length; i++) view[i] = wbout.charCodeAt(i) & 0xff; //convert to octet
    saveAs(
      new Blob([buf], { type: 'application/octet-stream' }),
      entry.searchString + '.xlsx'
    );
    dispatch(setAlert('Exported Successfully', 'success'));
  } catch (err) {
    dispatch(setAlert('Export Error', 'danger'));
    console.log(err.msg());
  }
};
