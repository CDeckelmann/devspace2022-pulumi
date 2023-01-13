import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as storage from "@pulumi/azure-native/storage";
import * as azure from "@pulumi/azure-native";
import { enums } from "@pulumi/azure-native/types";

const stackName = pulumi.getStack();
const projectName = pulumi.getProject();

// Create an Azure Resource Group
//const resourceGroup = new resources.ResourceGroup("resourceGroup");
const resourceGroup = new azure.resources.ResourceGroup(`${stackName}-${projectName}`);

// Create an Azure resource (Storage Account)
const storageAccount = new storage.StorageAccount("sa", {
    kind: storage.Kind.StorageV2,
    resourceGroupName: resourceGroup.name,
    sku: {
        name: storage.SkuName.Standard_LRS,
    },
    allowBlobPublicAccess: true 
});

let storageAccountName = storageAccount.name;

/*
// Export the primary key of the Storage Account
const storageAccountKeys = storage.listStorageAccountKeysOutput({
    containerName: containerName
    accountName: storageAccount.name
    publicAccess: enums.storage.PublicAccess.Container, 
    resourceGroupName: resourceGroup.name,
});

export const primaryStorageKey = storageAccountKeys.keys[0].value;
*/

const storageContainer = new azure.storage.BlobContainer("content", {
    containerName: pulumi.interpolate `${storageAccount.name}-content`,
    accountName: storageAccount.name,
    publicAccess: enums.storage.PublicAccess.Container, 
    resourceGroupName: resourceGroup.name
});

const website = new azure.storage.Blob("website", {
    resourceGroupName: resourceGroup.name,
    containerName: storageContainer.name,
    accountName: storageAccount.name,
    type: storage.BlobType.Block,
    blobName: "index.html",
    contentType: "text/html",
    source: new pulumi.asset.FileAsset("index.html")
});

export const websiteUrl =  website.url;

