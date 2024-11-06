const formatDate = (dateString) => {
    const date = new Date(dateString);

    const options = { month: "short", day: "2-digit", year: "numeric" };

    return new Intl.DateTimeFormat("en-US", options).format(date);
}
export default formatDate;