class convertData {

    static convertData(activity) {
        
        activity.name       = activity.name.replace("\nMitglied\n", "");
        activity.name       = activity.name.replace("\n", "");
        activity.name       = activity.name.replace("\n", "");
        activity.distance   = activity.distance.replace(',', '.');
        activity.distance   = parseFloat(activity.distance);
        activity.timestampS = Date.parse(activity.timestamp);
        
        // ToDo Daten säubern
        return activity;
    }
 
}
module.exports = convertData;