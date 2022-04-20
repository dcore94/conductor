export default { config };

var config = {
  "pep-credentials" : "Z...=",
  "hosts" : [
    {
      "host": "conductor",
      "audience" : "conductor-server",
      "allow-basic-auth" : true,
      "paths" : [
        {
          "name" : "metadata",
          "path" : "^/api/metadata/(taskdefs|workflow)/?.*$",
          "methods" : [
            {
              "method" : "GET",
              "scopes" : ["get","list"]
            }
          ]
        },
        {
          "name" : "metadata.taskdefs",
          "path" : "^/api/metadata/taskdefs/?.*$",
          "methods" : [
            {
              "method" : "POST",
              "scopes" : ["create"]
            },
            {
              "method" : "DELETE",
              "scopes" : ["delete"],
            },
            {
              "method" : "PUT",
              "scopes" : ["update"],
            }
          ]
        },
        {
          "name" : "metadata.workflow",
          "path" : "^/api/metadata/workflow/?.*$",
          "methods" : [
            {
              "method" : "POST",
              "scopes" : ["create"]
            },
            {
              "method" : "DELETE",
              "scopes" : ["delete"],
            },
            {
              "method" : "PUT",
              "scopes" : ["update"],
            }
          ]
        },
        {
          "name" : "workflow",
          "path" : "^/api/workflow/?.*$",
          "methods" : [
            {
              "method" : "GET",
              "scopes" : ["get"],
            },
            {
              "method" : "POST",
              "scopes" : ["start"],
            },
            {
              "method" : "DELETE",
              "scopes" : ["terminate"],
            }
          ]
        },
        {
          "name" : "task",
          "path" : "^/api/tasks/poll/.+$",
          "methods" : [
            {
              "method" : "GET",
              "scopes" : ["poll"],
            }
          ]
        },
        {
          "name" : "task",
          "path" : "^/api/tasks[/]?$",
          "methods" : [
            {
              "method" : "POST",
              "scopes" : ["update"],
            }
          ]
        }
      ]
    }
  ]  
}
