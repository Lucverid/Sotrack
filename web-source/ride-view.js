export function preferredRideView(settings={}){return ['north','heading','tilt'].includes(settings.ridePOV)?settings.ridePOV:'tilt';}
export function applyRideView(api,mode=preferredRideView(api.settings)){
 const view=['north','heading','tilt'].includes(mode)?mode:'tilt';
 api.mapPitch=view==='tilt'?45:0;
 api.setMapOrientation(view==='north'?'north':'heading');
 api.followPosition();
 if(view==='tilt')api.ensureNavigationMap?.();
 return view;
}
