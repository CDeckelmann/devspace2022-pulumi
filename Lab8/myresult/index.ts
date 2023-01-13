import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";

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

var lab7Ref = new pulumi.StackReference("lab7reference", {
    name: `cdeckelm/lab7/${stackName}`
});

var kubeConfig = lab7Ref.requireOutput("kubeConfig");

const k8sProvider = new k8s.Provider("aksprovider", {
    kubeconfig: kubeConfig
});

const opts: pulumi.CustomResourceOptions = {
    provider: k8sProvider
};

const namespace = new k8s.core.v1.Namespace("lab8-ns", {
    metadata: {
        name: "lab8"
    }
}, opts);

const pod = new k8s.core.v1.Pod("firstpod", {
    metadata: {
        name: "firstpod",
        namespace: namespace.metadata.name
    },
    spec: {
        containers: [{
            name: "nginx",
            image: "nginx"
        }]
    }
}, opts);
