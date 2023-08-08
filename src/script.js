// MODULES
const fs = require('fs');
var xml2js = require('xml2js');
var parseString = xml2js.parseString;

// INPUTS
const METADATA_FILE_NAME = "Address.settings-meta.xml"; //Metadata file to transform
const mapCountry = require('./mapCountryValues'); //Dataset with country values to be replaced (key 'CountryCode' ex: [ES])
const mapStates = require('./mapStateValues'); //Dataset with state values to be replaced (key 'CountryCode-StateCode' ex: ['AR-00'])

// OUTPUTS
const RESULT_FILE_NAME = "Address.settings-meta-fixed.xml"; //Result file with xml name
const LOG_FILE_NAME = "logs.txt"; //Result file with logs name

//LOGS
const logs = ['************** START SCRIPT ****************'];

try 
{
    //Read the metadata file
    const data = fs.readFileSync(METADATA_FILE_NAME, 'utf8');
    logs.push('Data successfully obtained from '+METADATA_FILE_NAME);

    parseString(data, function (err, result) {
        var root = result.AddressSettings.countriesAndStates[0].countries;
        logs.push('Countries to process: '+root.length);
        var numStates = 0;
        for(var i = 0; i < root.length; i++)
        {
            if(root[i].states != null){
                for(var j = 0; j < root[i].states.length; j++) {
                    numStates = numStates + root[i].states.length;
                }
            }
        }
        logs.push('States to process: '+numStates);

        var countryNotProcessed = [];
        var stateNotProcessed = [];
        var countryCount = 0;
        var stateCount = 0;


        for(var i = 0; i < root.length; i++)
        {
            var countryCode = root[i].isoCode[0];
            var countryLbl = root[i].label[0];
            var countryIntVal = root[i].integrationValue[0];
            var countryActive = root[i].active[0];
            var countryVisible = root[i].visible[0];
            var countryStandard = root[i].standard[0];

            //If any country doesn't has to be modified, his IsoCode must be included in this if condition
            //In this case, Andorra and Spain are skipped, despite values are included in the dataset for update
            if(countryCode != 'AD' && countryCode != 'ES') {
                logs.push('*****************************');
                logs.push('***** NEW COUNTRY INPUT *****');
                logs.push('Country input -> {label: '+countryLbl+', code: '+countryCode+', intVal: '+countryIntVal+', active: '+countryActive+', visible: '+countryVisible+', standard: '+countryStandard+'}');

                if(mapCountry.has(countryCode)){
                    root[i].active[0] = true;
                    root[i].visible[0] = true;
                    root[i].label[0] = mapCountry.get(countryCode);
                    root[i].integrationValue[0] = countryCode;
                    logs.push('Country modified -> {label: '+mapCountry.get(countryCode)+', code: '+countryCode+', intVal: '+countryCode+', active: true, visible: true, standard: '+countryStandard+'}');
                    mapCountry.delete(countryCode);
                    countryCount++;
                } else {
                    root[i].visible[0] = false;
                    countryNotProcessed.push(countryCode);
                }

                if(root[i].states != null) logs.push('# STATES INPUTS FOR THIS COUNTRY: '+root[i].states.length);
                else logs.push('NO STATES TO PROCESS');

                if(root[i].states != null){
                    for(var j = 0; j < root[i].states.length; j++)
                    {
                        var state = root[i].states[j];
                        
                        var stateCode = state.isoCode[0];
                        var stateLbl = state.label[0];
                        var stateIntVal = state.integrationValue[0];
                        var stateActive = state.active[0];
                        var stateVisible = state.visible[0];
                        var stateStandard = state.standard[0];
                        var stateKey = countryCode+'-'+stateCode;
                                  
                        logs.push('State input -> '+
                            '{key: '+stateKey+
                            ', label: '+stateLbl+
                            ', code: '+stateCode+
                            ', intVal: '+stateIntVal+
                            ', active: '+stateActive+
                            ', visible: '+stateVisible+
                            ', standard: '+stateStandard+
                        '}');

                        if(mapStates.has(stateKey)){
                            root[i].states[j].integrationValue[0] = stateCode;
                            root[i].states[j].active[0] = true;
                            root[i].states[j].visible[0] = true;
                            root[i].states[j].label[0] = mapStates.get(stateKey);
                            mapStates.delete(stateKey);
                            stateCount++;
                            
                            logs.push('State  '+stateKey+' modified -> '+
                                '{label: '+stateLbl+
                                ', code: '+stateCode+
                                ', intVal: '+stateIntVal+
                                ', active: '+stateActive+
                                ', visible: '+stateVisible+
                                ', standard: '+stateStandard+
                            '}');
                            
                        } else { // State in org not in dataset. VISIBLE = FALSE
                            root[i].states[j].visible[0] = false;
                            stateNotProcessed.push(stateKey);

                            //Add log
                            logs.push('Input state '+stateLbl+'('+stateKey+') not found in the dataset. Visibility set to false. Standard = '+stateStandard);
                        }
                    }
                }
            } else {
                logs.push('SKIPPED COUNTRY '+countryLbl+ '. INPUT -> '+root[i]);
            }
        }
        
        var builder = new xml2js.Builder();
        var xml = builder.buildObject(result);
    
        fs.writeFile(RESULT_FILE_NAME, xml, function(err) {
            if(err) {
                return console.log(err);
            }

            // DISPLAY FINAL STATUS
            console.log("The file was generated and saved!");
            console.log('************** SUMMARY ****************');
            console.log('- Processed countries: '+countryCount);
            console.log('- Processed states: '+stateCount);
            console.log('- Not modified countries = '+countryNotProcessed.length);
            console.log('- Not modified states = '+stateNotProcessed.length);
            console.log('***************************************');

            // ADD SUMMARY TO LOGS
            logs.push('\n\n************** SUMMARY ****************');
            logs.push('- Processed countries: '+countryCount);
            logs.push('- Processed states: '+stateCount);
            logs.push('- Not modified countries: '+countryNotProcessed.length);
            logs.push('- Not modified states: '+stateNotProcessed.length);
            if(stateNotProcessed.length > 0) {
                logs.push('{');
            }
            for(var i = 0; i < stateNotProcessed.length; i++){
                logs.push(stateNotProcessed[i]);
                if(i+1 == stateNotProcessed.length) {
                    logs.push('}');
                }
            }
            logs.push('***************************************');

            writeLogs();
        });     
    });
    
} catch (err) 
{
    console.error(err);
    logs.push('ERROR: '+err);
    writeLogs();
}

function writeLogs() {
    fs.writeFileSync(LOG_FILE_NAME, '');
    logs.forEach(message => {
        fs.appendFileSync(LOG_FILE_NAME, message + '\n');
    });
    console.log('See the \''+LOG_FILE_NAME+'\' for more information');
}