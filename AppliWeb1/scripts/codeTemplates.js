var codeTemplates = {};

codeTemplates.csharp = {
    formatProperties: function (property) {
        return property.Name + " = " + property.TypeName;
    },
    formatParameters: function (property, args) {
        return property.Name + " as " + property.TypeName;
    },
    formatArgumentsList: function (argumentsList, args) {
        if (args.length > 1 && args[1] == 'asObject') {
            return 'new { ' + argumentsList + ' }';
        }
        else {
            if ((argumentsList.match(/,/g) || []).length >= 1) {
                return 'new object[] { ' + argumentsList + ' }';
            }
            else {
                return argumentsList;
            }
        }
    },
    formatArguments: function (parameters, args) {
        if (args.length > 1 && args[1] == 'asObject') {
            return parameters.join(", ");
        }
        else {
            if (parameters.length > 1) {
                return 'new object[] { ' + parameters.join(", ") + ' }';
            }
            else {
                return parameters.join(", ");
            }
        }
    },
    samples: [
           '//Create a dynamic proxy from the PackageHost to send message\n' +
                        'PackageHost.CreateMessageProxy("{{ selectedMessageCallback.PackageName }}").{{ selectedMessageCallback.MessageCallback.MessageKey }}' +
                        '({{ generateArgumentsStack(selectedMessageCallback, "asObject") }});',
           '//Create the MessageScope, get the dynamic proxy then send message\n' +
                        'MessageScope.Create("{{ selectedMessageCallback.PackageName }}").GetProxy().{{ selectedMessageCallback.MessageCallback.MessageKey }}' +
                        '({{ generateArgumentsStack(selectedMessageCallback, "asObject") }});',
            '//Send message with standard method\n' +
                        'PackageHost.SendMessage(MessageScope.Create("{{ selectedMessageCallback.PackageName }}"), "{{ selectedMessageCallback.MessageCallback.MessageKey }}", ' +
                        '{{ generateArgumentsStack(selectedMessageCallback) }});'
    ],
    samplesWithSaga: [
            '//Create a dynamic proxy from the PackageHost to send message and await response\n' +
                        '{{selectedMessageCallback.MessageCallback.ResponseType}} response = await PackageHost.CreateMessageProxy("{{ selectedMessageCallback.PackageName }}").{{ selectedMessageCallback.MessageCallback.MessageKey }}<{{selectedMessageCallback.MessageCallback.ResponseType}}>' +
                        '({{ generateArgumentsStack(selectedMessageCallback, "asObject") }});',
            '//Create a dynamic proxy from the PackageHost to send message and get the task\n' +
                        'Task<{{selectedMessageCallback.MessageCallback.ResponseType}}> response = PackageHost.CreateMessageProxy("{{ selectedMessageCallback.PackageName }}").{{ selectedMessageCallback.MessageCallback.MessageKey }}<{{selectedMessageCallback.MessageCallback.ResponseType}}>' +
                        '({{ generateArgumentsStack(selectedMessageCallback, "asObject") }});',
            '//Create the MessageScope, get the dynamic proxy then send message and get the task\n' +
                        'Task<{{selectedMessageCallback.MessageCallback.ResponseType}}> response = MessageScope.Create("{{ selectedMessageCallback.PackageName }}").GetProxy().{{ selectedMessageCallback.MessageCallback.MessageKey }}<{{selectedMessageCallback.MessageCallback.ResponseType}}>' +
                        '({{ generateArgumentsStack(selectedMessageCallback, "asObject") }});',
             '//Create the MessageScope, attach response callback,  get the dynamic proxy then send message\n' +
                        'MessageScope.Create("{{ selectedMessageCallback.PackageName }}").OnSagaResponse(response => { /* Do something */ }. GetProxy().{{ selectedMessageCallback.MessageCallback.MessageKey }}' +
                        '({{ generateArgumentsStack(selectedMessageCallback, "asObject") }});',
    ]
};

codeTemplates.python = {
    formatProperties: function (property) {
        return '"' + property.Name + '" : "' + property.TypeName + '"';
    },
    formatParameters: function (property, args) {
        return property.Name + " : " + property.TypeName;
    },
    formatArgumentsList: function (argumentsList, args) {
        if ((argumentsList.match(/,/g) || []).length >= 1) {
            return '{ ' + argumentsList + ' }';
        }
        else {
            return argumentsList;
        }
    },
    formatArguments: function (parameters, args) {
        if (parameters.length > 1) {
            return '[ ' + parameters.join(", ") + ' ]';
        }
        else {
            return parameters.join(", ");
        }
    },
    samples: [
        '# Send message\n' +
        'Constellation.SendMessage("{{ selectedMessageCallback.PackageName }}", "{{ selectedMessageCallback.MessageCallback.MessageKey }}",' +
        ' {{ generateArgumentsStack(selectedMessageCallback) }}, Constellation.MessageScope.package)',
    ],
    samplesWithSaga: [
        '# Send message with saga\n' +
        'Constellation.SendMessageWithSaga(lambda response: DoSomething(response), "{{ selectedMessageCallback.PackageName }}", "{{ selectedMessageCallback.MessageCallback.MessageKey }}",' +
        ' {{ generateArgumentsStack(selectedMessageCallback) }}, Constellation.MessageScope.package)',
    ]
};

codeTemplates.js = {
    formatProperties: function (property) {
        return codeTemplates.python.formatProperties(property);
    },
    formatParameters: function (property, args) {
        return codeTemplates.python.formatParameters(property, args);
    },
    formatArgumentsList: function (argumentsList, args) {
        return codeTemplates.python.formatArgumentsList(argumentsList, args);
    },
    formatArguments: function (parameters, args) {
        return codeTemplates.python.formatArguments(parameters, args);
    },
    samples: [
        "constellation.server.sendMessage({ Scope: 'Package', Args: ['{{ selectedMessageCallback.PackageName }}'] }, '{{ selectedMessageCallback.MessageCallback.MessageKey }}',  '{{ generateArgumentsStack(selectedMessageCallback) }}');",
    ]
};

codeTemplates.ng = {
    formatProperties: function (property) {
        return codeTemplates.js.formatProperties(property);
    },
    formatParameters: function (property, args) {
        return codeTemplates.js.formatParameters(property, args);
    },
    formatArgumentsList: function (argumentsList, args) {
        return codeTemplates.js.formatArgumentsList(argumentsList, args);
    },
    formatArguments: function (parameters, args) {
        return codeTemplates.js.formatArguments(parameters, args);
    },
    samples: [
        "consumer.sendMessage({ Scope: 'Package', Args: ['{{ selectedMessageCallback.PackageName }}'] }, '{{ selectedMessageCallback.MessageCallback.MessageKey }}',  '{{ generateArgumentsStack(selectedMessageCallback) }}');",
    ]
};

codeTemplates.http = {
    formatProperties: function (property) {
        return codeTemplates.js.formatProperties(property);
    },
    formatParameters: function (property, args) {
        return codeTemplates.js.formatParameters(property, args);
    },
    formatArgumentsList: function (argumentsList, args) {
        return codeTemplates.js.formatArgumentsList(argumentsList, args);
    },
    formatArguments: function (parameters, args) {
        return codeTemplates.js.formatArguments(parameters, args);
    },
    samples: [
        '{{ constellationServerUri }}/rest/constellation/SendMessage?SentinelName=xxxx&PackageName=xxxx&AccessKey=xxxx&scope=Package&args={{ selectedMessageCallback.PackageName }}&key={{ selectedMessageCallback.MessageCallback.MessageKey }}&data={{ generateArgumentsStack(selectedMessageCallback) }}',
    ]
};

codeTemplates.netmf = {
    formatProperties: function (property) {
        return codeTemplates.csharp.formatProperties(property);
    },
    formatParameters: function (property, args) {
        return codeTemplates.csharp.formatParameters(property, args);
    },
    formatArgumentsList: function (argumentsList, args) {
        return codeTemplates.csharp.formatArgumentsList(argumentsList, args);
    },
    formatArguments: function (parameters, args) {
        return codeTemplates.csharp.formatArguments(parameters, args);
    },
    samples: [
        'this.constellation.SendMessage(ScopeType.Package, "{{ selectedMessageCallback.PackageName }}", "{{ selectedMessageCallback.MessageCallback.MessageKey }}", {{ generateArgumentsStack(selectedMessageCallback) }});',
    ]
};

codeTemplates.arduino = {
    formatProperties: function (property) {
        return codeTemplates.js.formatProperties(property);
    },
    formatParameters: function (property, args) {
        return codeTemplates.js.formatParameters(property, args);
    },
    formatArgumentsList: function (argumentsList, args) {
        return codeTemplates.js.formatArgumentsList(argumentsList, args);
    },
    formatArguments: function (parameters, args) {
        return codeTemplates.js.formatArguments(parameters, args);
    },
    samples: [
        'constellation.sendMessage(\"Package\", \"{{ selectedMessageCallback.PackageName }}\", \"{{ selectedMessageCallback.MessageCallback.MessageKey }}\", {{ generateArgumentsStack(selectedMessageCallback) }});',
    ]
};