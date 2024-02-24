import Cookies from "js-cookie";


const ADD_IMAGE = '/groups/:groupId/images'




const addImage = (image) => ({
    type: ADD_IMAGE,
    payload: image
})




export const addGroupImage = (payload, groupId) => async(dispatch) => {
console.log("🚀 ~ addEventImage ~ eventId:", groupId)
console.log("🚀 ~ addEventImage ~ payload:", payload)

    const getCookie = () => {
        return Cookies.get("XSRF-TOKEN");
    };

    const res = await fetch(`/api/groups/${groupId}/images`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'XSRF-TOKEN': getCookie()
        },
        body: JSON.stringify(payload)
    })

    const data = await res.json()
    dispatch(addImage(data))
    return data
}



const initialState = { eventimages: {} }

function groupImageReducer(state = initialState, action) {
    switch (action.type) {
        case ADD_IMAGE:
            return {
                ...state,
                eventimages: {
                    ...state.eventimages, [action.payload.id]: action.payload
                }
            }

        default:
            return state
    }
}

export default groupImageReducer