# Country and State Picklist Values Metadata Transformation Script

Are you tired of configuring picklist values for Salesforce countries and provinces in each of your new organizations? 
Wouldn't it be awesome to do it automatically with an excel? 
Are you reading this with a telemarketing voice? 
Align the values with your excel automatically with a few clicks!  

## Table of Contents

- [Introduction](#introduction)
- [Author](#author)
- [Steps to update SF Metadata](#steps-to-update-sf-metadata)
- [Declarations](#declarations)
- [Installation and usage](#installation-and-usage)
- [Configuration and customizations](#configuration-and-customization)
- [Excel formulas to obtain dataset](#excel-formulas)
- [Notes](#notes)

## Introduction

This script transforms an XML metadata input file by aligning its values with the input dataset provided. The purpose of the script is to massively update the Salesforce (SF) Country and State picklist values using the Metadata API defining the input data values.

Please note that, to run this script and load the values successfully, you need first to review in Setup the standard states in your organization and create any new IsoCodes that are not included in the standard (SF) dataset. Through Metadata API, IsoCodes can't be created, modified or deleted.

Attached in the repository you can find the "StateCodes" folder, which contains all the information about a managed package that can help you to create easily new IsoCodes using a batch. The main issue of this package is that the integrationValue is set like the label (instead of the IsoCode, which is the mainly used value in external systems) and, after a long process until all the IsoCodes are created, there are still conflicts with countries that contains standard states (duplicated IsoCodes or labels).

So, the purpose of this script, is to easily configure the values after running the StateCodes package using the Metadata API. By this way, with this script you can introduce the metadata SF file as an input and, using variables preconfigured with your dataset, an output file will be generated with only visibles the country/states available in the dataset, and the IsoCode as the integrationValue.

Any collaboration is welcome :) There are another options to achieve the successfully values configuration, such as use the managed package class to create your own batch and run it with your desired configuration (but still with inactive values), or we can even improve this script in order to be able to connect into a SF Organization, introduce the default input metadata, and execute a POST callout to create the value in SF and include it in the output file to activate the mapped standard values through metadata API with it.

## Author

- **Author Name:** Iván Requena García
- **Email:** ivanreqg@gmail.com
- **GitHub:** [irega97](https://github.com/Irega97)

## Steps to update SF Metadata

1. Prepare your input files with the dataset
2. Retrieve the `Address.settings-meta.xml` from your org and place the content in the file with the same name in this directory
3. Run the script
4. Replace your `Address.settings-meta.xml` content with the generated content in file `Address.settings-meta-fixed.xml`
5. Deploy the replaced `Address.settings-meta.xml` using Metadata API

## Declarations

###  Inputs

- `Address.settings-meta.xml`: This file contains the SF Metadata of country and state picklist values that you want to modify.
- `mapCountryValues.js`: This file contains the country data that you want to replace. Review that all the values are correct.
- `mapStateValues.js`: This file contains the state data that you want to replace. Review that all the values are correct.

### Outputs

- `logs.txt`: This result file contains a log of all the actions executed during the script's run for review.
- `Address.settings-meta-fixed.xml`: This is the result file where the original metadata input is updated with values replaced according to the input variables.

## Installation and usage

To run this script, follow these steps:

1. **Clone the Repository:**
   Clone this repository to your local machine or download the script files.

2. **Install Dependencies:**
   Open a terminal and navigate to the directory containing the script files. Run the following command to install the required dependencies:
    > npm install fs xml2js

3. **Configure Input Files:**
    Ensure that you have the following input files in the same directory as the script:
    - `Address.settings-meta.xml`: SF Metadata input file.
    - `mapCountryValues.js`: Country data to be aligned.
    - `mapStateValues.js`: State data to be aligned.

4. **Run the Script:**
    In the terminal, run the script using Node.js:
    > node script.js

    - The script reads the input files, processes the metadata, and creates the output files.
    - The `script.js` script contains the logic to transform the metadata based on the input data. It updates all the values, except the IsoCode, which cannot be modified. Feel free to adapt and modify the script as needed for your specific use case.
    - If the country/state is included in the array input data to be aligned (files `mapStateValues.js` and `mapCountryValues.js`), it will be set as active and visible. If not, only visible is set to false to avoid deployment errors (due to an active value cannot be deactivated).

5. **Review the output:**
    - Check the `Address.settings-meta-fixed.xml` file to see the updated metadata.
    - Review the `logs.txt` file to understand the actions executed during the script's run.

## Configuration and Customization

Before running the script, you can customize the following constants in the `script.js` file:

- `METADATA_FILE_NAME`: Name of the input XML metadata file to modify. (`Address.settings-meta.xml`)
- `RESULT_FILE_NAME`: Name of the output XML metadata file. (`Address.settings-meta-fixed.xml`)
- `LOG_FILE_NAME`: Name of the log file capturing executed actions. (`logs.txt`)

## Excel formulas
Here you can find Excel formulas to transform a table into a valid dataset for running the script.

Imagine you have the following table:

|       A      |       B         |     C      |       D       |
|--------------|-----------------|------------|---------------|
| Country Code | Country Name    | State Code | State Name    |
|--------------|-----------------|------------|---------------|
| ES           | España          | 8          | Barcelona     |
| ES           | España          | 23         | Madrid        |
| CA           | Canada          | ON         | Ontario       |
| CA           | Canada          | QC         | Quebec        |
| ...          | ...             | ...        | ...           |

To obtain valid datasets, you can use the following formulas:

### mapCountryValues

=CONCAT("['";A;"', '";B;"']")

Output (remove duplicates if necessary):
['ES','España'],
['CA','Canada'], ... //Don't forget to delete the last value comma!!!

### mapStateValues

=CONCAT("['";A;"-";TEXTO(C;"00");"', '";D;"'],")

Output:
['ES-08','Barcelona'],
['ES-23','Madrid'],
['CA-ON','Ontario'],
['CA-QC','Quebec'], ... //Don't forget to delete the last value comma!!!

## Notes

- This script performs XML metadata transformation according to the provided input data and doesn't overwrites the original input. The output will be overwritten everytime the script is executed.
- The integration value for states and countries will be equal to the IsoCode after transformation. 
- Remember to place the input files (`Address.settings-meta.xml`, `mapCountryValues.js`, and `mapStateValues.js`) in the same directory as your script. 
- Review the log files and output carefully before deploy to ensure accurate results. The logs file will be overwritten every time the script is executed.

Please feel free to adapt and modify the script as needed for your specific use case.