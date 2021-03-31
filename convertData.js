class convertData {

    static convertData(activity) {
        
        activity.name       = activity.name.replace("\nSubscriber\n", "");
        activity.name       = activity.name.replace("\nMitglied\n", "");
        activity.name       = activity.name.replace("\n", "");
        activity.name       = activity.name.replace("\n", "");
        activity.distance   = activity.distance.replace(',', '.');
        activity.distance   = parseFloat(activity.distance);
        if(activity.elevgain != null) {
            activity.elevgain   = activity.elevgain.replace(',', '.');
            activity.elevgain   = parseFloat(activity.elevgain);
        }
        activity.date       = new Date(activity.timestamp);
    
        return activity;
    }
 
}
module.exports = convertData;