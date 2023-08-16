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

//CONSTANTS
const lstSkipCountries = ['ES','AD']; //List of input countries that we want to bypass update despite it's in dataset
const logs = ['************** START SCRIPT ****************']; //Logs array

try 
{
    //Read the metadata file
    const data = fs.readFileSync(METADATA_FILE_NAME, 'utf8');
    logs.push('Data successfully obtained from '+METADATA_FILE_NAME);

    //Transform the input file and generate the output files
    parseString(data, function (err, result) {
        //Auxiliar variables
        var numStatesInp = 0; //Number of states to process from input metadata
        var countryCount = 0; //Number of countries updated
        var stateCount = 0; //Number of states updated
        var countryNotProcessed = []; //List with IsoCode of input countries not in the dataset
        var stateNotProcessed = []; //List with IsoCode of input states not in the dataset

        //Store countries and states list from the input metadata in root variable
        var root = result.AddressSettings.countriesAndStates[0].countries;

        //Add logs with numbers of countries and states in the input metadata
        logs.push('SF Countries to process: '+root.length);
        for(var i = 0; i < root.length; i++)
        {
            if(root[i].states != null){
                numStatesInp = numStatesInp + root[i].states.length;
            }
        }
        logs.push('SF States to process: '+numStatesInp);
        logs.push('Country inputs: '+mapCountry.size);
        logs.push('State inputs: '+mapStates.size);

        //Iterate over the countries and states list
        for(var i = 0; i < root.length; i++)
        {
            //Country item data variables
            var countryCode = root[i].isoCode[0];
            var countryLbl = root[i].label[0];
            var countryIntVal = root[i].integrationValue[0];
            var countryActive = root[i].active[0];
            var countryVisible = root[i].visible[0];
            var countryStandard = root[i].standard[0];

            //Check if any country must to be skipped
            if(!lstSkipCountries.includes(countryCode)) {

                //Add log with country item information
                logs.push('*****************************');
                logs.push('***** NEW COUNTRY INPUT *****');
                logs.push('Country input -> '+
                    '{label: '+countryLbl+
                    ', code: '+countryCode+
                    ', intVal: '+countryIntVal+
                    ', active: '+countryActive+
                    ', visible: '+countryVisible+
                    ', standard: '+countryStandard+
                '}');

                //Check if the country isoCode is in the countries dataset and update values
                if(mapCountry.has(countryCode)){
                    root[i].active[0] = true;
                    root[i].visible[0] = true;
                    logs.push('Country '+countryCode+' set to active and visible');
                    mapCountry.delete(countryCode);
                    countryCount++;
                } else { //If it's not in the dataset, visible is set to false and IsoCode is added to the list for the log
                    root[i].visible[0] = false;
                    countryNotProcessed.push(countryCode);
                    logs.push('404: Country '+countryLbl+'('+countryCode+') not found in the dataset. Visibility set to false. Standard = '+countryStandard);
                }

                //Add log with num of states to process for the country item
                if(root[i].states != null) logs.push('# STATES INPUTS FOR THIS COUNTRY: '+root[i].states.length);
                else logs.push('NO STATES TO PROCESS');

                //Iterate over the input country states
                if(root[i].states != null){
                    for(var j = 0; j < root[i].states.length; j++)
                    {
                        //State item data variables
                        var state = root[i].states[j];
                        var stateCode = state.isoCode[0]; //STATE ISO CODE
                        var stateKey = countryCode+'-'+stateCode; //DATASET KEY
                        var stateLbl = state.label[0];
                        var stateIntVal = state.integrationValue[0];
                        var stateActive = state.active[0];
                        var stateVisible = state.visible[0];
                        var stateStandard = state.standard[0];
                            
                        //Add log with state input info
                        logs.push('State input -> '+
                            '{key: '+stateKey+
                            ', label: '+stateLbl+
                            ', code: '+stateCode+
                            ', intVal: '+stateIntVal+
                            ', active: '+stateActive+
                            ', visible: '+stateVisible+
                            ', standard: '+stateStandard+
                        '}');

                        //Check if the state isoCode is in the states dataset and update values
                        if(mapStates.has(stateKey)){
                            root[i].states[j].integrationValue[0] = stateCode;
                            root[i].states[j].active[0] = true;
                            root[i].states[j].visible[0] = true;
                            stateCount++;
                            
                            //Add log with state processed
                            logs.push('State  '+stateKey+' modified -> '+
                                '{label: '+stateLbl+
                                ', code: '+stateCode+
                                ', intVal: '+stateCode+
                                ', active: true'+
                                ', visible: true'+
                                ', standard: '+stateStandard+
                            '}');

                            mapStates.delete(stateKey);
                        
                        } else if(mapStates.has(countryCode+'-'+stateIntVal)) {
                            root[i].states[j].active[0] = true;
                            root[i].states[j].visible[0] = true;
                            stateCount++;
                            
                            //Add log with state processed
                            logs.push('State  '+stateKey+' modified -> '+
                                '{label: '+stateLbl+
                                ', code: '+stateCode+
                                ', intVal: '+stateIntVal+
                                ', active: true'+
                                ', visible: true'+
                                ', standard: '+stateStandard+
                            '}');

                            mapStates.delete(countryCode+'-'+stateIntVal);

                        } else { //If it's not in the dataset, visible is set to false and IsoCode is added to the list for the log
                            root[i].states[j].visible[0] = false;
                            stateNotProcessed.push(stateKey + ' - '+root[i].states[j].label[0]);
                            logs.push('404: State '+stateLbl+'('+stateKey+') not found in the dataset. Visibility set to false. Standard = '+stateStandard);
                        }
                    }
                }
            } else {
                countryNotProcessed.push(countryCode);
                mapCountry.delete(countryCode);
                logs.push('SKIPPED COUNTRY '+countryLbl);
            }
        }
        
        //Generate output file
        var builder = new xml2js.Builder();
        var xml = builder.buildObject(result);
    
        fs.writeFile(RESULT_FILE_NAME, xml, function(err) {
            if(err) {
                return console.log(err);
            }

            // DISPLAY FINAL STATUS IN CONSOLE
            console.log("The file was generated and saved! You can use the \'"+RESULT_FILE_NAME+"\' to deploy your metadata into SF");
            console.log('************** SUMMARY ****************');
            console.log('- # Countries set to active: '+countryCount);
            console.log('- # States set to active: '+stateCount);
            console.log('- Not modified countries: '+countryNotProcessed.length+' '+countryNotProcessed);
            console.log('- Countries not found in SF: '+mapCountry.size);
            console.log('- Not modified states: '+stateNotProcessed.length);
            console.log('- States not found in SF: '+mapStates.size);
            console.log('***************************************');

            // ADD SUMMARY TO LOGS
            logs.push('\n\n************** SUMMARY ****************');
            logs.push('- # Countries set to active: '+countryCount);
            logs.push('- # States set to active: '+stateCount);
            logs.push('- Not modified countries: '+countryNotProcessed.length+' '+countryNotProcessed);
            logs.push('- Countries not found in SF: '+mapCountry.size);
            if(mapCountry.size > 0) {
                logs.push('{');
                for(let [key, value] of mapCountry){
                    logs.push(key+' : '+value);
                    if(i+1 == mapCountry.size) {
                        logs.push('}');
                    }
                }
            }
            logs.push('- Not modified states: '+stateNotProcessed.length);
            if(stateNotProcessed.length > 0) {
                logs.push('{');
                for(var i = 0; i < stateNotProcessed.length; i++){
                    logs.push(stateNotProcessed[i]);
                    if(i+1 == stateNotProcessed.length) {
                        logs.push('}');
                    }
                }
            }
            logs.push('- States not found in SF: '+mapStates.size);
            if(mapStates.size > 0) {
                logs.push('{');
                for(let [key, value] of mapStates){
                    logs.push(key+' : '+value);
                    if(i+1 == mapStates.size) {
                        logs.push('}');
                    }
                }
            }
            logs.push('***************************************');

            //GENERATE LOGS FILE
            writeLogs();
        });     
    });
    
} catch (err) 
{
    //Display the error and store it in logs
    console.error(err);
    logs.push('ERROR: '+err);
    writeLogs();
}

//Helper function that generate logs output file
function writeLogs() {
    try {
        fs.writeFileSync(LOG_FILE_NAME, '');
        logs.forEach(message => {
            fs.appendFileSync(LOG_FILE_NAME, message + '\n');
        });
        console.log('See the \''+LOG_FILE_NAME+'\' for more information');
    } catch (error) {
        console.log('Error generating logs: '+error);
    }
}