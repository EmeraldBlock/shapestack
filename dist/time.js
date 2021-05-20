var Time;
(function (Time) {
    Time[Time["MILLI"] = 1] = "MILLI";
    Time[Time["SECOND"] = 1000] = "SECOND";
    Time[Time["MINUTE"] = 60000] = "MINUTE";
    Time[Time["HOUR"] = 3600000] = "HOUR";
})(Time || (Time = {}));
export default Time;
