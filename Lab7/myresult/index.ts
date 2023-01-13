import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as storage from "@pulumi/azure-native/storage";
import { listManagedClusterUserCredentials } from "@pulumi/azure-native/containerservice";
import { VirtualMachineSizeTypes } from "@pulumi/azure-native/compute";
import * as container from "@pulumi/azure-native/containerservice";
import { RegressionPrimaryMetrics } from "@pulumi/azure-native/types/enums/machinelearningservices/v20220201preview";

const config = new pulumi.Config();
const stackName = pulumi.getStack()
const projectName = pulumi.getProject()

// Create an Azure Resource Group
const resourceGroup = new resources.ResourceGroup("resourceGroup");
const nodeCount = config.requireNumber("NodeCount");
const kubernetesVersion = config.require("KubernetesVersion");

// Create an Azure resource (Storage Account)
const storageAccount = new storage.StorageAccount("sa", {
    resourceGroupName: resourceGroup.name,
    sku: {
        name: storage.SkuName.Standard_LRS,
    },
    kind: storage.Kind.StorageV2,
});

// Export the primary key of the Storage Account
const storageAccountKeys = storage.listStorageAccountKeysOutput({
    resourceGroupName: resourceGroup.name,
    accountName: storageAccount.name
});

export const primaryStorageKey = storageAccountKeys.keys[0].value;

const k8scluster = new container.ManagedCluster("managedCluster", {
    agentPoolProfiles: [{
        count: nodeCount,     // 1, aus config holen
        name: "nodepool",
        osType: container.OSType.Linux,
        type: container.AgentPoolType.VirtualMachineScaleSets, 
        vmSize: VirtualMachineSizeTypes.Standard_D2s_v3,
        mode: container.AgentPoolMode.System,
    }],
    kubernetesVersion: kubernetesVersion,
    dnsPrefix: stackName,
    resourceGroupName: resourceGroup.name,
    resourceName: "akscluster",
    identity: {
        type: container.ResourceIdentityType.SystemAssigned
    }
});

// resoureGroup.name: Output<string>
// k8scluster.name: Output<string>

/*
resourceGroup
    .name
    .apply(resGroupName => k8scluster.name.apply(clusterName => listManagedClusterUserCredentials));
*/

const credentials =
    pulumi
    .all([k8scluster.name, resourceGroup.name])
    .apply(([clusterName, rgName]) => {
        return listManagedClusterUserCredentials({
            resourceGroupName: rgName,
            resourceName: clusterName
        })
    })

const encoded = credentials.kubeconfigs[0].value;
export const kubeConfig = 
    pulumi.secret(encoded.apply(enc => Buffer.from(enc, "base64").toString()));

//pulumi stack output kubeConfig --show-secrets > kube.config 
//kubectl get pods --all-namespaces --kubeconfig=kube.config