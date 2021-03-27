class convertData {

    static convertData(activity) {
        
        activity.name       = activity.name.replace("\nMitglied\n", "");
        activity.name       = activity.name.replace("\n", "");
        activity.name       = activity.name.replace("\n", "");
        activity.distance   = activity.distance.replace(',', '.');
        activity.distance   = parseFloat(activity.distance);
        activity.date       = new Date(activity.timestamp);
    
        return activity;
    }
 
}
module.exports = convertData;