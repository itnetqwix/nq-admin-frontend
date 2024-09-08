import moment from "moment"

function debounce(func, delay) {
    let timeoutId

    return function (...args) {
        clearTimeout(timeoutId)

        return new Promise(resolve => {
            timeoutId = setTimeout(() => {
                resolve(func.apply(this, args))
            }, delay)
        })
    }
}

const searchMedicine = (query, data, key) => {
    const lowerCaseQuery = query?.toLowerCase()?.trim()

    return data?.filter(data => data[key]?.toLowerCase().includes(lowerCaseQuery))
}

export const debouncedSearchMedicine = debounce(searchMedicine, 300)

export const dynamicImageURL = (url) => {
    let updatedURL = url?.toString()?.split("public")[1]
    if (updatedURL === undefined) {
        return url
    }
    updatedURL = process?.env?.NEXT_PUBLIC_API_BASE_URL + "/public" + url?.toString()?.split("public")[1]
    return updatedURL
}

export const BookedSession = {
    confirm: "confirm",
    confirmed: "confirmed",
    booked: "booked",
    canceled: "canceled",
    completed: "completed",
    start: "start",
};

export const isCurrentDateBefore = (dateToCompare) => {
    const currentDate = moment();
    const dateToCompareMoment = moment(dateToCompare);
    return currentDate.isBefore(dateToCompareMoment);
};

export const updateTicketBaseUrl = {
    constact_us: '/update-contact-us-status',
    raise_concern: '/update-raised-concern-ticket'
}
export const getSignedURL = (url) => {
    return `https://data.netqwix.com/${url}`
}

// export const generateVideoURL = (clip) => {
//     return `https://netquixnew.s3.ap-south-1.amazonaws.com/${clip?.file_name}`
// }

export const statusColors = {
    open: 'green',
    in_progress: 'orange',
    close: 'red',
};