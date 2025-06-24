declare module '../amplify_outputs.json' {
  interface AmplifyOutputs {
    auth?: {
      region: string;
      userPoolId: string;
      userPoolClientId: string;
      identityPoolId?: string;
    };
    api?: {
      region: string;
      endpoint: string;
      apiName: string;
      authorizationType?: string;
    };
    storage?: {
      region: string;
      bucket: string;
    };
    [key: string]: any;
  }
  
  const outputs: AmplifyOutputs;
  export default outputs;
}